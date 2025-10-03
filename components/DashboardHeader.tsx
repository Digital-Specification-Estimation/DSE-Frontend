"use client";

import { useEffect, useState, useRef } from "react";
import { IoMdNotificationsOutline } from "react-icons/io";
import io, { type Socket } from "socket.io-client";
import { useDispatch, useSelector } from "react-redux";
import Image from "next/image";

import asread from "@/public/asread.svg";
import {
  addNotification,
  markAllAsRead,
  type NotificationType,
  setNotifications,
  useGetNotificationsQuery,
} from "@/lib/redux/notificationSlice";
import type { RootState } from "@/lib/store";

const SOCKET_SERVER_URL =
  process.env.NEXT_PUBLIC_SOCKET_SERVER_URL ||
  "http://localhost:4000";

const DashboardHeader = () => {
  const dispatch = useDispatch();
  const { data: pastNotifications } = useGetNotificationsQuery();
  const notifications = useSelector(
    (state: RootState) => state.notificationsState.notifications
  );

  const [notificationShow, setNotificationShow] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_SERVER_URL, { transports: ["websocket"] });

      socketRef.current.on("connect", () => {
        console.log("Connected to WebSocket server");
      });

      socketRef.current.on("notification", (message: string) => {
        dispatch(
          addNotification({
            id: Date.now().toString(),
            message,
            read: false,
            createdAt: new Date().toISOString(),
          })
        );
      });

      socketRef.current.on("notification-read", () => {
        dispatch(markAllAsRead());
      });

      socketRef.current.on("broadcast-message", (message: string) => {
        dispatch(
          addNotification({
            id: Date.now().toString(),
            message,
            read: false,
            createdAt: new Date().toISOString(),
          })
        );
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (pastNotifications && pastNotifications.length > 0) {
      // Only set notifications if the Redux state is empty
      if (notifications.length === 0) {
        dispatch(setNotifications(pastNotifications));
      }
    }
  }, [pastNotifications, dispatch, notifications.length]);

  const unreadCount = notifications.filter(
    (n: NotificationType) => !n.read
  ).length;

  const getDay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { weekday: "long" });
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead());
    if (socketRef.current) {
      socketRef.current.emit("mark-notifications-read");
    }
    setNotificationShow(false);
  };

  return (
    <div className="flex relative z-20 max-[1000px]:w-full items-end justify-end max-[1000px]:justify-around p-4 bg-white border-b">
      <div className="flex items-center space-x-4 relative">
        <div className="relative">
          <span
            className="w-[40px] h-[40px] rounded-full grid place-items-center bg-gray-200 cursor-pointer relative"
            onClick={() => setNotificationShow(!notificationShow)}
          >
            <IoMdNotificationsOutline className="text-gray-600 text-xl" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </span>

          {notificationShow && (
            <div className="absolute top-12 right-0 w-[400px] bg-white shadow border rounded-lg p-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-gray-800 font-semibold">Notifications</h3>
                <button
                  type="button"
                  title="Mark all as read"
                  className="bg-gray-200 rounded-full p-3 "
                  onClick={handleMarkAllAsRead}
                >
                  <Image
                    src={asread || "/placeholder.svg"}
                    width={20}
                    height={20}
                    alt="asread"
                    title="Mark all as read"
                  />
                </button>
                <button
                  className="text-gray-500 text-sm"
                  onClick={() => setNotificationShow(false)}
                >
                  Close
                </button>
              </div>
              {notifications.length > 0 ? (
                notifications.map((notif: NotificationType, index: number) => (
                  <div key={index} className="mt-4 p-2 border-b">
                    <p
                      className={`text-sm ${
                        notif.read
                          ? "text-gray-500"
                          : "text-gray-600 font-semibold"
                      }`}
                    >
                      {notif.message}
                    </p>
                    <p className="text-xs text-gray-400">
                      {notif.createdAt} <span> {getDay(notif.createdAt)}</span>
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 mt-4">
                  No notifications
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
