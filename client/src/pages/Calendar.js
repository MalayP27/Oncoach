import { useEffect, useRef, useState } from "react";
import { useTranscript } from "../context/TranscriptContext";

export default function Calendar() {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const date = new Date();
  const { startListening, workoutEvents } = useTranscript();

  // refs for each day column content
  const colRefs = useRef([]);
  const [maxColHeight, setMaxColHeight] = useState(0);

  // measure tallest column whenever data or window size changes
  useEffect(() => {
    const measure = () => {
      const heights = colRefs.current.map(
        (el) => (el ? el.scrollHeight : 0)
      );
      const max = Math.max(0, ...heights);
      setMaxColHeight(max);
    };

    // slight delay so DOM paints first
    const id = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", measure);
    };
  }, [workoutEvents]);

  return (
    <div className="flex flex-col min-h-screen px-8 pt-6">
      <h2 className="text-xl font-semibold mb-4">
        {date.toLocaleDateString(undefined, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </h2>

      <div className="grid grid-cols-7 gap-3 border rounded p-4 bg-white shadow-sm">
        {days.map((day, idx) => (
          <div key={idx} className="flex flex-col w-full items-start">
            <div className="bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-sm font-medium mb-2 w-full text-center">
              {day}
            </div>

            {/* No fixed height; we set a shared minHeight to match the tallest column */}
            <div
              ref={(el) => (colRefs.current[idx] = el)}
              style={maxColHeight ? { minHeight: `${maxColHeight}px` } : {}}
              className="w-full bg-orange-200 rounded-md p-2 flex flex-col gap-3 text-left"
            >
              {(workoutEvents?.[day] || []).length > 0 ? (
                workoutEvents[day].map((event, i) => (
                  <div key={i} className="bg-white rounded shadow px-3 py-2">
                    <div className="text-orange-600 font-bold text-sm">
                      {event.time ? `${event.time} - ` : ""}
                      {event.title}
                      {event.option && (
                        <span className="text-xs italic text-gray-500 ml-2">
                          (Option {event.option})
                        </span>
                      )}
                    </div>

                    {event.description?.length > 0 && (
                      <ul className="list-disc list-inside text-gray-700 text-xs mt-1">
                        {event.description.map((line, ii) => (
                          <li key={ii}>{line}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 italic text-center w-full">
                  No workout
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between mt-6">
        <button
          onClick={startListening}
          className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600"
        >
          Speak to Coach
        </button>
        <button className="bg-white text-orange-500 border border-orange-500 px-4 py-2 rounded hover:bg-orange-100">
          Add Event
        </button>
      </div>
    </div>
  );
}
