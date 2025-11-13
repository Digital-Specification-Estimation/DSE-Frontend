"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { IoMdNotificationsOutline } from "react-icons/io";
import { FiSearch } from "react-icons/fi";
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
    <div className="flex relative z-20 max-[1000px]:w-full items-center justify-between p-4 bg-white border-b">
      {/* Search Bar */}
      <div className="relative w-1/3 max-w-md" ref={searchRef}>
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
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <kbd className="inline-flex items-center px-2 py-1.5 text-xs font-sans border rounded bg-gray-100 text-gray-500">
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
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <FiSearch className="mr-3 h-5 w-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{route.name}</p>
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
      <div className="flex items-center space-x-4">
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
