"use client";

import React from "react";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { IoMdNotificationsOutline, IoMdClose } from "react-icons/io";
import { FiSearch, FiUser, FiClock } from "react-icons/fi";
import io, { type Socket } from "socket.io-client";
import { useDispatch, useSelector } from "react-redux";
import Image from "next/image";
import { useSessionQuery } from "@/lib/redux/authSlice";
import { motion, AnimatePresence } from "framer-motion";

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
  process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:4000";

const DashboardHeader = () => {
  const dispatch = useDispatch();
  const { data: pastNotifications } = useGetNotificationsQuery();
  const notifications = useSelector(
    (state: RootState) => state.notificationsState.notifications
  );

  const [notificationShow, setNotificationShow] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { data: sessionData } = useSessionQuery();

  // Define available routes with their display names
  const routes = [
    { path: "/dashboard", name: "Dashboard" },
    { path: "/attendance", name: "Attendance" },
    { path: "/attendance-history", name: "Attendance History" },
    { path: "/budget-planning", name: "Budget Planning" },
    { path: "/business-setup", name: "Business Setup" },
    { path: "/cost-control", name: "Cost Control" },
    { path: "/employee-management", name: "Employee Management" },
    { path: "/payroll", name: "Payroll" },
    { path: "/project-management", name: "Project Management" },
    { path: "/settings", name: "Settings" },
    { path: "/user-management", name: "User Management" },
  ];

  // Filter routes based on search query
  const filteredRoutes = routes.filter(
    (route) =>
      route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showSearchResults) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredRoutes.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < filteredRoutes.length) {
            handleRouteClick(filteredRoutes[selectedIndex].path);
          }
          break;
        case "Escape":
          setShowSearchResults(false);
          setSelectedIndex(-1);
          break;
        default:
          break;
      }
    },
    [filteredRoutes, selectedIndex, showSearchResults]
  );

  // Reset selected index when search query changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchQuery]);

  // Handle click outside to close search results
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSearchResults(false);
      }
    }

    // Handle keyboard shortcut (Ctrl+K or Cmd+K)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setShowSearchResults(true);
      }
      // Close on Escape key
      else if (e.key === "Escape") {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleRouteClick = useCallback(
    (path: string) => {
      router.push(path);
      setShowSearchResults(false);
      setSearchQuery("");
    },
    [router]
  );

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
    <div className="flex relative  z-20 max-[1000px]:w-full items-center justify-between p-[10px] pl-[40px] max-sm:pl-[10px] bg-white border-b">
      {/* Search Bar */}
      <div className="relative w-1/3 max-sm:w-[200px] max-w-md" ref={searchRef}>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            className="block w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search routes..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setShowSearchResults(false);
                setSelectedIndex(-1);
              } else {
                handleKeyDown(e as unknown as React.KeyboardEvent);
              }
            }}
          />
          <div className="absolute inset-y-0 right-0 max-sm:hidden flex items-center pr-3">
            <kbd className="inline-flex items-center  px-2.5 py-1.5 border-gray-500 border-b-[3px] text-xs font-medium rounded-md border border-gray-200 bg-white text-gray-500 shadow-sm hover:bg-gray-50 transition-colors duration-150 pointer-events-none">
              {navigator.platform.includes("Mac") ? "⌘" : "Ctrl+"}K
            </kbd>
          </div>
        </div>

        {/* Search Results Dropdown */}
        {showSearchResults && searchQuery && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm max-h-60 overflow-auto">
            {filteredRoutes.length > 0 ? (
              filteredRoutes.map((route, index) => (
                <div
                  key={index}
                  className={`px-4 py-2 ${
                    index === selectedIndex ? "bg-gray-100" : "hover:bg-gray-50"
                  } text-gray-900 cursor-pointer flex items-center`}
                  onClick={() => handleRouteClick(route.path)}
                >
                  <FiSearch className="mr-3 h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{route.name}</p>
                    <p className="text-xs text-gray-500">{route.path}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-2 text-gray-500">No routes found</div>
            )}
          </div>
        )}
      </div>

      {/* Notification and User Section */}
      <div className=" items-center">
        <div className="relative flex  items-center">
          <div className="relative flex-row items-center justify-center flex space-x-4">
            <button
              onClick={() => setNotificationShow(!notificationShow)}
              className=" rounded-md bg-gray-100 border-[1px] border-gray-200 px-[10px] h-[40px] hover:bg-gray-200 transition-all duration-200 relative"
              aria-label="Notifications"
              aria-expanded={notificationShow}
            >
              <IoMdNotificationsOutline className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-medium rounded-full h-4 w-4 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Profile Button */}
            <button
              onClick={() => router.push("/profile")}
              className="p-[5px] pr-[20px] max-sm:pr-[5px] rounded-full border-[1px] border-gray-200 flex flex-row items-center justify-center sm:space-x-[10px] bg-gray-100 hover:bg-gray-200 transition-colors relative"
              aria-label="User profile"
            >
              {sessionData?.user?.image_url ? (
                <img
                  src={"http://localhost:4000/" + sessionData.user.image_url}
                  alt={sessionData.user.username || "User"}
                  className="w-[40px] h-[40px] rounded-full object-cover"
                />
              ) : (
                <div className="w-[50px] h-[50px] rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-sm">
                  {sessionData?.user?.username?.charAt(0).toUpperCase() || "U"}
                </div>
              )}
              <div className="flex flex-col items-start ">
                <span className="ml-2 hidden text-[14px] md:inline">
                  {sessionData?.user?.username || "User"}
                </span>
                <span className="ml-2 hidden text-gray-500 text-[12px] md:inline">
                  {sessionData?.user?.email || "User"}
                </span>
              </div>
            </button>

            <AnimatePresence>
              {notificationShow && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute top-12 right-0 w-[320px] md:w-[400px] bg-white shadow-lg border border-gray-100 rounded-lg overflow-hidden z-50"
                >
                  <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="text-gray-800 font-semibold text-sm">
                      Notifications
                    </h3>
                    <button
                      onClick={() => setNotificationShow(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="Close notifications"
                    />
                    <button
                      type="button"
                      className="text-blue-500 hover:text-blue-600 text-xs font-medium transition-colors"
                      onClick={() => {
                        dispatch(markAllAsRead());
                        if (socketRef.current) {
                          socketRef.current.emit("mark-all-read");
                        }
                      }}
                    >
                      Mark all as read
                    </button>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                      <IoMdNotificationsOutline className="w-10 h-10 text-gray-300 mb-2" />
                      <p className="text-gray-500 text-sm">
                        No notifications yet
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        We'll notify you when something new arrives
                      </p>
                    </div>
                  ) : (
                    notifications.map((notification) => {
                      const date = new Date(notification.createdAt);
                      const now = new Date();
                      const diffInHours = Math.floor(
                        (now.getTime() - date.getTime()) / (1000 * 60 * 60)
                      );

                      let timeAgo;
                      if (diffInHours < 24) {
                        timeAgo = `${diffInHours}h ago`;
                      } else {
                        timeAgo = date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        });
                      }

                      return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className={`p-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors ${
                            !notification.read ? "bg-blue-50" : ""
                          }`}
                        >
                          <div className="flex items-start">
                            <div
                              className={`flex-shrink-0 h-2 w-2 mt-1.5 rounded-full ${
                                !notification.read
                                  ? "bg-blue-500"
                                  : "bg-transparent"
                              }`}
                            />
                            <div className="ml-2 flex-1">
                              <p className="text-sm text-gray-800">
                                {notification.message}
                              </p>
                              <div className="flex items-center mt-1 text-xs text-gray-400">
                                <FiClock className="mr-1 w-3 h-3" />
                                <span>{timeAgo}</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
