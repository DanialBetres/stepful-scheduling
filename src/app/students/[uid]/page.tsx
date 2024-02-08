"use client";
import { db } from "@/firebase/config";
import { useEffect, useState } from "react";
import { parseISO, startOfToday } from "date-fns";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";

export type Coach = {
  firstName: string;
  lastName: string;
  id: string;
  availableSlots: { [key: string]: string[] };
  bookedSlots: { [key: string]: string[] };
};

export type Meeting = {
  coachId: string;
  date: string;
  time: string;
  rating: number | null;
  notes: string;
  studentId: string;
  coach: Coach | undefined;
  meetingId: string;
};

const StudentDashboard = ({ params }: { params: { uid: string } }) => {
  const [bookedMeetings, setBookedMeetings] = useState<{
    past: Meeting[];
    future: Meeting[];
  }>({ past: [], future: [] });
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [selectedAvailableSlot, setSelectedAvailableSlot] = useState<{
    date: string;
    time: string;
  } | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const getCoaches = async () => {
    const coachesArr: Coach[] = [];
    const coachesSnapshot = await getDocs(collection(db, "coaches"));
    coachesSnapshot.forEach((doc) => {
      coachesArr.push({ ...(doc.data() as Omit<Coach, "id">), id: doc.id });
    });

    setCoaches(coachesArr);
  };

  const getBookedMeetings = async () => {
    const bookedMeetings: { past: Meeting[]; future: Meeting[] } = {
      past: [],
      future: [],
    };

    const meetingsSnapshot = await query(
      collection(db, "meetings"),
      where("studentId", "==", params?.uid)
    );
    const meetings = await getDocs(meetingsSnapshot);

    meetings.forEach((doc) => {
      if (parseISO(doc.data().date) < startOfToday()) {
        bookedMeetings.past.push({
          ...(doc.data() as Omit<Meeting, "coach" | "meetingId">),
          coach: coaches.find((coach) => coach.id === doc.data().coachId),
          meetingId: doc.id,
        });
      } else {
        bookedMeetings.future.push({
          ...(doc.data() as Omit<Meeting, "coach" | "meetingId">),
          coach: coaches.find((coach) => coach.id === doc.data().coachId),
          meetingId: doc.id,
        });
      }
    });
    setBookedMeetings(bookedMeetings);
  };

  useEffect(() => {
    getCoaches();
  }, []);

  useEffect(() => {
    getBookedMeetings();
  }, [coaches]);

  const onSubmit = async () => {
    setStatus("loading");
    if (!selectedCoach || !selectedAvailableSlot) return;

    const meeting = {
      coachId: selectedCoach?.id,
      studentId: params?.uid,
      date: selectedAvailableSlot?.date,
      time: selectedAvailableSlot?.time,
      rating: null,
      notes: "",
    };

    const meetingDoc = await addDoc(collection(db, "meetings"), meeting);
    const coachRef = doc(db, "coaches", selectedCoach?.id);

    await setDoc(
      coachRef,
      {
        availableSlots: {
          ...selectedCoach?.availableSlots,
          [selectedAvailableSlot?.date]: selectedCoach?.availableSlots[
            selectedAvailableSlot?.date
          ]?.filter((slot) => slot !== selectedAvailableSlot?.time),
        },
        bookedSlots: {
          ...selectedCoach?.bookedSlots,
          [selectedAvailableSlot?.date]: [
            ...(selectedCoach?.bookedSlots[selectedAvailableSlot?.date] || []),
            meetingDoc.id,
          ],
        },
      },
      { merge: true }
    );
    await getCoaches();
    setSelectedAvailableSlot(null);
    setSelectedCoach(null);
    setStatus("success");
  };
  return (
    <div>
      <div>
        <div className="mt-10">
          <label
            htmlFor="coaches"
            className="block text-sm font-medium leading-6 text-white"
          >
            Coaches
          </label>
          <select
            id="coaches"
            name="Coaches"
            className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
            onChange={(e) => {
              const selected = coaches.find(
                (coach) => coach.id === e.target.value
              );
              setSelectedCoach(selected || null);
            }}
            value={selectedCoach?.id || "-- select an option --"}
          >
            <option disabled selected>
              -- select an option --
            </option>

            {coaches.map((coach) => (
              <option key={coach.id} value={coach.id}>
                {coach.firstName} {coach.lastName}
              </option>
            ))}
          </select>
        </div>
        {selectedCoach?.availableSlots && (
          <div className="mt-10">
            <label
              htmlFor="availableSlots"
              className="block text-sm font-medium leading-6 text-white"
            >
              Available Slots
            </label>
            <select
              id="availableSlots"
              name="AvailableSlots"
              className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
              onChange={(e) => {
                setSelectedAvailableSlot({
                  date: e.target.value.split(",")[0],
                  time: e.target.value.split(",")[1],
                });
              }}
              value={selectedAvailableSlot?.date || "-- select an option --"}
            >
              <option disabled selected>
                -- select an option --
              </option>
              {Object.keys(selectedCoach.availableSlots)?.map((date) => {
                const slots = selectedCoach.availableSlots[date];
                return slots.map((slot) => {
                  return (
                    <option key={slot} value={[date, slot]}>
                      {date} - {slot}
                    </option>
                  );
                });
              })}
            </select>
          </div>
        )}

        <div className="mt-10">
          <button
            type="button"
            className="rounded bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            disabled={!selectedAvailableSlot}
            onClick={() => onSubmit()}
          >
            Book Slot
          </button>
        </div>
        {status === "loading" && <p>Loading...</p>}
        {status === "success" && <p>Slot booked successfully!</p>}
      </div>
      <div>
        <h2 className="text-2xl mt-10">Booked Meetings</h2>
        <h3 className="text-lg mt-3 italic">Past Meetings</h3>
        <div>
          <ul role="list" className="divide-y divide-gray-800">
            {bookedMeetings.past.map((meeting) => (
              <li
                key={meeting.meetingId}
                className="flex justify-between gap-x-6 py-5"
              >
                <div className="flex min-w-0 gap-x-4">
                  <div className="min-w-0 flex-auto">
                    <p className="text-sm font-semibold leading-6 text-white">
                      {meeting.coach?.firstName} {meeting.coach?.lastName}
                    </p>
                    <p className="mt-1 truncate text-xs leading-5 text-gray-400">
                      {meeting.date} - {meeting.time}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <h3 className="text-lg mt-3 italic">Upcoming Meetings</h3>
        <div>
          <ul role="list" className="divide-y divide-gray-800">
            {bookedMeetings.future.map((meeting) => (
              <li
                key={meeting.meetingId}
                className="flex justify-between gap-x-6 py-5"
              >
                <div className="flex min-w-0 gap-x-4">
                  <div className="min-w-0 flex-auto">
                    <p className="text-sm font-semibold leading-6 text-white">
                      {meeting.coach?.firstName} {meeting.coach?.lastName}
                    </p>
                    <p className="mt-1 truncate text-xs leading-5 text-gray-400">
                      {meeting.date} - {meeting.time}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
