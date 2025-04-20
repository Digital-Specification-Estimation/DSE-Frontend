"use client";

import { useEffect, useState, useRef } from "react";
import { IoFilterOutline, IoSearchSharp } from "react-icons/io5";
import { IoMdNotificationsOutline } from "react-icons/io";
import io, { Socket } from "socket.io-client";
import { useDispatch, useSelector } from "react-redux";
import Image from "next/image";

import asread from "@/public/asread.svg";
import {
  addNotification,
  markAllAsRead,
  NotificationType,
  setNotifications,
  useGetNotificationsQuery,
} from "@/lib/redux/notificationSlice";
import { RootState } from "@/lib/store";

const SOCKET_SERVER_URL = "http://localhost:4000";
const DashboardHeader = () => {
  const dispatch = useDispatch();
  const { data: pastNotifications } = useGetNotificationsQuery();
  const notifications = useSelector(
    (state: RootState) => state.notificationsState.notifications
  );
  const [notificationShow, setNotificationShow] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("title");

  const [socketUpdateTrigger, setSocketUpdateTrigger] = useState(0);

  const socketRef = useRef<Socket>(null);

  useEffect(() => {
    socketRef.current = io(SOCKET_SERVER_URL, { transports: ["websocket"] });

    socketRef.current.on("connect", () => {
      console.log("Connected to WebSocket server");
    });

    socketRef?.current?.on("notification", (message: string) => {
      const isDuplicate = notifications.some(
        (notif: NotificationType) => notif.message === message
      );

      if (!isDuplicate) {
        const newNotification = {
          id: Date.now().toString(),
          message,
          read: false,
          createdAt: new Date().toISOString(),
        };
        dispatch(addNotification(newNotification));
        setSocketUpdateTrigger((prev) => prev + 1);
      }
    });

    socketRef.current.on("notification-read", () => {
      dispatch(markAllAsRead());
      setSocketUpdateTrigger((prev) => prev + 1);
    });

    socketRef.current.on("broadcast-message", (message: string) => {
      const newNotification = {
        id: Date.now().toString(),
        message,
        read: false,
        createdAt: new Date().toISOString(),
      };
      dispatch(addNotification(newNotification));
      setSocketUpdateTrigger((prev) => prev + 1);
    });

    return () => {
      socketRef?.current?.disconnect();
    };
  }, [dispatch, notifications, socketUpdateTrigger]);

  useEffect(() => {
    if (pastNotifications) {
      dispatch(setNotifications(pastNotifications));
    }
  }, [pastNotifications, socketUpdateTrigger, dispatch]);

  const unreadCount = notifications.filter(
    (n: NotificationType) => !n.read
  ).length;

  const getDay = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.toLocaleDateString("en-US", { weekday: "long" });
    return day;
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead());
    socketRef?.current?.emit("mark-notifications-read");
    setNotificationShow(false); // Emit event to backend
  };

  return (
    <div className="flex relative z-20 max-[1000px]:w-full items-end justify-end max-[1000px]:justify-around p-4 bg-white border-b">
      {/* Search Bar */}
      {/* <div className="flex items-center gap-4 max-[1000px]:ml-0 bg-gray-100 rounded-md w-[60%] px-4 py-2 relative"> */}
      {/* Filter Button */}
      {/* <div className="relative"> */}
      {/* <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => setFilterOpen(!filterOpen)}
          >
            <IoFilterOutline className="text-gray-400" />
            <p className="text-[14px] text-gray-400">{selectedFilter}</p>
          </div> */}

      {/* Filter Dropdown */}
      {/* {filterOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white shadow-md rounded-md border p-2">
              {[
                "title",
                "skills",
                "seniority_level",
                "status",
                "category",
                "contactEmail",
                "moneyPrize",
                "Requirements",
              ].map((filter) => (
                <p
                  key={filter}
                  className="p-2 cursor-pointer hover:bg-gray-100 text-sm"
                  onClick={() => {
                    setSelectedFilter(filter);
                    setFilterOpen(false);
                  }}
                >
                  {filter}
                </p>
              ))}
            </div>
          )}
        </div> */}
      {/* </div> */}

      {/* Right Section */}
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
                    src={asread}
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
        {/* <img
          src="/profile2.webp"
          alt="User"
          className="w-[40px] h-[40px] object-cover cursor-pointer rounded-full"
        /> */}
      </div>
    </div>
  );
};

export default DashboardHeader;
