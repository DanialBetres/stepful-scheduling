"use client";
import { useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import {
  add,
  differenceInMinutes,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isEqual,
  isSameDay,
  isSameMonth,
  isToday,
  parse,
  parseISO,
  startOfToday,
} from "date-fns";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase/config";

type SlotType = {
  id: string;
  startDatetime: string;
  endDatetime: string;
};

function classNames(...classes: any) {
  return classes.filter(Boolean).join(" ");
}

export const CoachCalendar = ({ params }: { params: { uid: string } }) => {
  let today = startOfToday();
  let [selectedDay, setSelectedDay] = useState(today);
  let [currentMonth, setCurrentMonth] = useState(format(today, "MMM-yyyy"));
  let firstDayCurrentMonth = parse(currentMonth, "MMM-yyyy", new Date());
  const [times, setTimes] = useState<string[]>([]);
  const [selectedAvailabilitySlot, setSelectedAvailabilitySlot] =
    useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<SlotType[]>([]);
  const [selectedDaySlots, setSelectedDaySlots] = useState<SlotType[]>([]);
  let days = eachDayOfInterval({
    start: firstDayCurrentMonth,
    end: endOfMonth(firstDayCurrentMonth),
  });

  function previousMonth() {
    let firstDayNextMonth = add(firstDayCurrentMonth, { months: -1 });
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"));
  }

  function nextMonth() {
    let firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 });
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"));
  }

  useEffect(() => {
    setSelectedDaySlots(
      availableSlots
        .filter((availableSlot) =>
          isSameDay(parseISO(availableSlot.startDatetime), selectedDay)
        )
        .sort((a, b) => differenceInMinutes(a.startDatetime, b.startDatetime))
    );
  }, [availableSlots, selectedDay]);

  useEffect(() => {
    const timesArr = [];
    for (let i = 0; i < 24; i++) {
      let hours = i.toString().length === 1 ? `0${i}` : i;
      timesArr.push(`${hours}:00`);
      timesArr.push(`${hours}:30`);
    }
    setTimes(timesArr);
  }, []);

  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!params?.uid) {
        return;
      }
      const docRef = doc(db, "coaches", params.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const { availableSlots: currentSlotsBooked } = docSnap.data();
        const arr: SlotType[] = [];
        const availableSlotsArr = Object.entries(currentSlotsBooked);
        availableSlotsArr.forEach(([date, slots]) => {
          slots.forEach((slot: string) => {
            arr.push({
              id: Math.random().toString(),
              startDatetime: `${date}T${slot}`,
              endDatetime: `${date}T${format(
                add(parse(slot, "H:mm", new Date()), {
                  hours: 2,
                }),
                "HH:mm"
              )}`,
            });
          });
        });
        setAvailableSlots(arr);
      } else {
        console.log("No document!");
      }
    };

    fetchAvailableSlots();
  }, [params, selectedDay]);

  const addAvailability = async () => {
    const docRef = doc(db, "coaches", params.uid);
    const formattedDay = format(selectedDay, "y-MM-dd");
    const availableSlotsForTheDay = selectedDaySlots.map((slot) =>
      format(slot.startDatetime, "HH:mm")
    );
    availableSlotsForTheDay.push(selectedAvailabilitySlot);
    setAvailableSlots((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        startDatetime: `${formattedDay}T${selectedAvailabilitySlot}`,
        endDatetime: `${formattedDay}T${format(
          add(parse(selectedAvailabilitySlot, "H:mm", new Date()), {
            hours: 2,
          }),
          "HH:mm"
        )}`,
      },
    ]);
    await setDoc(
      docRef,
      {
        availableSlots: {
          [formattedDay]: availableSlotsForTheDay,
        },
      },
      { merge: true }
    );
  };

  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-lg mt-10">
      <div className="px-4 py-5 sm:p-6">
        <div className="pt-16">
          <div className="max-w-md px-4 mx-auto sm:px-7 md:max-w-4xl md:px-6">
            <div className="md:grid md:grid-cols-2 md:divide-x md:divide-gray-200">
              <div className="md:pr-14">
                <div className="flex items-center">
                  <h2 className="flex-auto font-semibold text-gray-900">
                    {format(firstDayCurrentMonth, "MMMM yyyy")}
                  </h2>
                  <button
                    type="button"
                    onClick={previousMonth}
                    className="-my-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
                  >
                    <span className="sr-only">Previous month</span>
                    <ChevronLeftIcon className="w-5 h-5" aria-hidden="true" />
                  </button>
                  <button
                    onClick={nextMonth}
                    type="button"
                    className="-my-1.5 -mr-1.5 ml-2 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
                  >
                    <span className="sr-only">Next month</span>
                    <ChevronRightIcon className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>
                <div className="grid grid-cols-7 mt-10 text-xs leading-6 text-center text-gray-500">
                  <div>S</div>
                  <div>M</div>
                  <div>T</div>
                  <div>W</div>
                  <div>T</div>
                  <div>F</div>
                  <div>S</div>
                </div>
                <div className="grid grid-cols-7 mt-2 text-sm">
                  {days.map((day, dayIdx) => (
                    <div
                      key={day.toString()}
                      className={classNames(
                        dayIdx === 0 && colStartClasses[getDay(day)],
                        "py-1.5"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedDay(day)}
                        className={classNames(
                          isEqual(day, selectedDay) && "text-white",
                          !isEqual(day, selectedDay) &&
                            isToday(day) &&
                            "text-red-500",
                          !isEqual(day, selectedDay) &&
                            !isToday(day) &&
                            isSameMonth(day, firstDayCurrentMonth) &&
                            "text-gray-900",
                          !isEqual(day, selectedDay) &&
                            !isToday(day) &&
                            !isSameMonth(day, firstDayCurrentMonth) &&
                            "text-gray-400",
                          isEqual(day, selectedDay) &&
                            isToday(day) &&
                            "bg-red-500",
                          isEqual(day, selectedDay) &&
                            !isToday(day) &&
                            "bg-gray-900",
                          !isEqual(day, selectedDay) && "hover:bg-gray-200",
                          (isEqual(day, selectedDay) || isToday(day)) &&
                            "font-semibold",
                          "mx-auto flex h-8 w-8 items-center justify-center rounded-full"
                        )}
                      >
                        <time dateTime={format(day, "yyyy-MM-dd")}>
                          {format(day, "d")}
                        </time>
                      </button>

                      <div className="w-1 h-1 mx-auto mt-1">
                        {availableSlots.some((availableSlot) =>
                          isSameDay(parseISO(availableSlot.startDatetime), day)
                        ) && (
                          <div className="w-1 h-1 rounded-full bg-sky-500"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <section className="mt-12 md:mt-0 md:pl-14">
                <h2 className="font-semibold text-gray-900">
                  Availabilty Slots for{" "}
                  <time dateTime={format(selectedDay, "yyyy-MM-dd")}>
                    {format(selectedDay, "MMM dd, yyy")}
                  </time>
                </h2>
                <ol className="mt-4 space-y-1 text-sm leading-6 text-gray-500">
                  {selectedDaySlots.length > 0 ? (
                    selectedDaySlots.map((slot) => (
                      <AvailableSlot slot={slot} key={slot.id} />
                    ))
                  ) : (
                    <p>No slots for today.</p>
                  )}
                </ol>
                <div className="overflow-hidden rounded-lg bg-gray-900 shadow mt-10">
                  <div className="px-4 py-5 sm:p-6">
                    {" "}
                    <div>
                      <label
                        htmlFor="location"
                        className="block text-sm  leading-6 text-white"
                      >
                        Add 2 hour slot starting from:
                      </label>
                      <select
                        id="location"
                        name="location"
                        className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        defaultValue=""
                        onChange={(e) => {
                          setSelectedAvailabilitySlot(e.target.value);
                        }}
                      >
                        {times.map((time) => (
                          <option key={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      className="mt-8 w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                      onClick={() => {
                        addAvailability();
                      }}
                    >
                      Add Availability
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AvailableSlot = ({ slot }: { slot: SlotType }) => {
  let startDateTime = parseISO(slot.startDatetime);
  let endDateTime = parseISO(slot.endDatetime);
  return (
    <li className="flex items-center px-4 py-2 space-x-4 group rounded-xl focus-within:bg-gray-100 hover:bg-gray-100">
      <div className="flex-auto">
        <p className="mt-0.5">
          <time dateTime={slot.startDatetime}>
            {format(startDateTime, "h:mm a")}
          </time>{" "}
          -{" "}
          <time dateTime={slot.endDatetime}>
            {format(endDateTime, "h:mm a")}
          </time>
        </p>
      </div>
    </li>
  );
};

let colStartClasses = [
  "",
  "col-start-2",
  "col-start-3",
  "col-start-4",
  "col-start-5",
  "col-start-6",
  "col-start-7",
];

export default CoachCalendar;
