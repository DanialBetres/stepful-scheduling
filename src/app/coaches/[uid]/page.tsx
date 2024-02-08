"use client";

import { Coach, Meeting } from "@/app/students/[uid]/page";
import { db } from "@/firebase/config";
import { parseISO, startOfToday } from "date-fns";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";

export const CoachDashboard = ({ params }: { params: { uid: string } }) => {
  const [bookedMeetings, setBookedMeetings] = useState<{
    past: Meeting[];
    future: Meeting[];
  }>({ past: [], future: [] });
  const [coach, setCoach] = useState<Coach | undefined>(undefined);

  const getBookedMeetings = async () => {
    const bookedMeetings: { past: Meeting[]; future: Meeting[] } = {
      past: [],
      future: [],
    };
    const meetingsSnapshot = await query(
      collection(db, "meetings"),
      where("coachId", "==", params?.uid)
    );
    const meetings = await getDocs(meetingsSnapshot);
    meetings.forEach((doc) => {
      if (parseISO(doc.data().date) < startOfToday()) {
        bookedMeetings.past.push({
          ...(doc.data() as Omit<Meeting, "coach" | "meetingId">),
          coach: coach,
          meetingId: doc.id,
        });
      } else {
        bookedMeetings.future.push({
          ...(doc.data() as Omit<Meeting, "coach" | "meetingId">),
          coach: coach,
          meetingId: doc.id,
        });
      }
    });
    setBookedMeetings(bookedMeetings);
  };

  useEffect(() => {
    const fetchCoachData = async () => {
      const coachDocRef = doc(db, "coaches", params.uid);
      const coachDoc = await getDoc(coachDocRef);
      if (coachDoc.exists()) {
        const coachData = coachDoc.data();
        setCoach({ ...(coachData as Coach), id: params.uid });
      }
    };
    fetchCoachData();
  }, [params.uid]);

  useEffect(() => {
    getBookedMeetings();
  }, [coach]);

  return (
    <div>
      <h2 className="text-2xl mt-10">Booked Meetings</h2>
      <h3 className="text-lg mt-3 italic">Past Meetings</h3>
      <div>
        <ul role="list" className="divide-y divide-gray-800">
          {bookedMeetings.past.map((meeting) => (
            <li
              key={meeting.meetingId}
              className="flex w-full justify-between gap-x-6 py-5 px-10"
            >
              <div className="flex min-w-32 gap-x-4 justify-between">
                <div className="min-w-0 flex-auto">
                  <p className="text-sm font-semibold leading-6 text-white">
                    Student Id: {meeting.studentId}
                  </p>
                  <p className="mt-1 truncate text-xs leading-5 text-gray-400">
                    {meeting.date} - {meeting.time}
                  </p>
                  <p className="mt-1 truncate text-xs leading-5 text-gray-400">
                    rating: {meeting.rating || "Not rated"}
                  </p>
                  <p className="mt-1 truncate text-xs leading-5 text-gray-400">
                    feedback: {meeting.notes || "No feedback"}
                  </p>
                </div>
              </div>
              <div className="my-auto  ">
                <button
                  type="button"
                  className="rounded bg-indigo-500 px-2 py-1 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                >
                  Rate or give feedback
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <h3 className="text-lg mt-3 italic">Future Meetings</h3>
      <div>
        <ul role="list" className="divide-y divide-gray-800">
          {bookedMeetings.future.map((meeting) => (
            <li
              key={meeting.meetingId}
              className="flex w-full justify-between gap-x-6 py-5 px-10"
            >
              <div className="flex min-w-32 gap-x-4 justify-between">
                <div className="min-w-0 flex-auto">
                  <p className="text-sm font-semibold leading-6 text-white">
                    Student Id: {meeting.studentId}
                  </p>
                  <p className="mt-1 truncate text-xs leading-5 text-gray-400">
                    {meeting.date} - {meeting.time}
                  </p>
                  <p className="mt-1 truncate text-xs leading-5 text-gray-400">
                    rating: {meeting.rating || "Not rated"}
                  </p>
                  <p className="mt-1 truncate text-xs leading-5 text-gray-400">
                    feedback: {meeting.notes || "No feedback"}
                  </p>
                </div>
              </div>
              <div className="my-auto  ">
                <button
                  type="button"
                  className="rounded bg-indigo-500 px-2 py-1 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                >
                  Rate or give feedback
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CoachDashboard;
