"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Calendar, Clock, AlertCircle, CheckCircle2, Clock3, User, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays, parseISO, isToday, subMonths } from "date-fns";
import { useGetAttendanceHistoryQuery, useEditAttendanceMutation, useGetAttendancesWithReasonsQuery } from "@/lib/redux/attendanceSlice";
import { useGetEmployeeQuery } from "@/lib/redux/employeeSlice";
import { useSessionQuery } from "@/lib/redux/authSlice";
import { Sidebar } from "@/components/sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AttendanceHistory() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const employeeId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  // State hooks
  const [activeTab, setActiveTab] = useState("all");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: format(subMonths(new Date(), 3), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [selectedReason, setSelectedReason] = useState<any>(null);
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
  
  // Memoize query parameters to prevent unnecessary refetches
  const queryParams = useMemo(() => ({
    employeeId,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  }), [employeeId, dateRange.startDate, dateRange.endDate]);
  
  // RTK Query hooks
  const { data: sessionData, isLoading: isLoadingSession } = useSessionQuery();
  const { data: employee, isLoading: isLoadingEmployee } = useGetEmployeeQuery(employeeId);
  const { data: attendanceData, isLoading: isLoadingAttendance, error, refetch } = useGetAttendanceHistoryQuery(queryParams);
  const { data: attendancesWithReasons, refetch: refetchReasons } = useGetAttendancesWithReasonsQuery(queryParams);
  const [updateAttendance] = useEditAttendanceMutation();
  const userfetched = sessionData?.user;
  const user : {
    name: string;
    role: string;
    avatar?: string;
  } = {
    name: userfetched?.username as string,
    role: userfetched?.current_role as string,
    avatar: userfetched?.avatar as string,
  };

  // Memoized values
  const filteredAttendance = useMemo(() => {
    if (!attendanceData) return [];
    
    if (activeTab === "all") return attendanceData;
    
    return attendanceData.filter((record: any) => 
      record.status?.toLowerCase() === activeTab.toLowerCase()
    );
  }, [attendanceData, activeTab]);

  const groupedAttendance = useMemo(() => {
    if (!filteredAttendance || filteredAttendance.length === 0) return {};
    
    return filteredAttendance.reduce((acc: Record<string, any[]>, record: any) => {
      const date = parseISO(record.date);
      const monthYear = format(date, 'MMMM yyyy');
      if (!acc[monthYear]) {
        acc[monthYear] = [];
      }
      acc[monthYear].push({ ...record, date });
      return acc;
    }, {});
  }, [filteredAttendance]);

  const stats = useMemo(() => {
    if (!attendanceData) return null;
    
    const totalDays = attendanceData.length;
    const presentDays = attendanceData.filter((r: any) => r.status?.toLowerCase() === 'present').length;
    const lateDays = attendanceData.filter((r: any) => r.status?.toLowerCase() === 'late').length;
    const absentDays = attendanceData.filter((r: any) => r.status?.toLowerCase() === 'absent').length;
    
    return {
      totalDays,
      presentDays,
      lateDays,
      absentDays,
      attendanceRate: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0
    };
  }, [attendanceData]);

  // Effects
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load attendance history. Please try again later.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Event handlers
  const handleDateRangeChange = (start: Date | undefined, end: Date | undefined) => {
    if (start && end) {
      setDateRange({
        startDate: format(start, 'yyyy-MM-dd'),
        endDate: format(end, 'yyyy-MM-dd')
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'present':
        return (
          <Badge className="bg-green-50 text-green-700 hover:bg-green-50 border-0">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            Present
          </Badge>
        );
      case 'late':
        return (
          <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-0">
            <Clock3 className="h-3.5 w-3.5 mr-1.5" />
            Late
          </Badge>
        );
      case 'absent':
        return (
          <Badge className="bg-red-50 text-red-700 hover:bg-red-50 border-0">
            <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
            Absent
          </Badge>
        );
      default:
        return <Badge variant="outline">{status || 'N/A'}</Badge>;
    }
  };

  // Handle update attendance
  const handleUpdateAttendance = async () => {
    if (!selectedAttendance || !selectedStatus) return;

    try {
      // Format the date as ISO string
      const formatDateForApi = (dateString: string | Date) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toISOString();
      };

      const requestBody = {
        employeeId: employeeId, // Match the backend's expected field name
        date: formatDateForApi(selectedAttendance.date),
        status: selectedStatus,
      };
      
      console.log('Sending data to /attendance/update:', requestBody);

      await updateAttendance(requestBody).unwrap();

      toast({
        title: "Success",
        description: "Attendance updated successfully",
      });
      
      setIsEditModalOpen(false);
      refetch(); // Refresh the data
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to update attendance",
        variant: "destructive",
      });
    }
  };

  // Open edit modal
  const openEditModal = (attendance: any) => {
    setSelectedAttendance(attendance);
    setSelectedStatus(attendance.status);
    setIsEditModalOpen(true);
  };

  const handleViewReason = (attendance: any) => {
    setSelectedReason(attendance);
    setIsReasonModalOpen(true);
  };

  // Loading state
  if (isLoadingEmployee || isLoadingAttendance || isLoadingSession) {
    return (
      <div className="flex h-screen bg-white">
        <Sidebar user={user} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader user={user} />
          <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-4 mb-6">
                <Skeleton className="h-9 w-9 rounded-md" />
                <Skeleton className="h-8 w-48" />
              </div>
              
              <div className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={`skeleton-${i}`} className="h-28 rounded-xl" />
                  ))}
                </div>
                
                <div className="flex space-x-4 mb-6">
                  {['All', 'Present', 'Late', 'Absent'].map((tab) => (
                    <Skeleton key={tab} className="h-10 w-20 rounded-md" />
                  ))}
                </div>
                
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={`skeleton-${i}`} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Error state
  if (!employee) {
    return (
      <div className="flex h-screen bg-white">
        <Sidebar user={user} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader user={user} />
          <main className="flex-1 overflow-y-auto p-6 bg-white">
            <div className="max-w-6xl mx-auto h-full flex items-center justify-center">
              <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Employee Not Found</h2>
                <p className="text-gray-500 mb-6">The requested employee record could not be found or you don't have permission to view it.</p>
                <Button 
                  onClick={() => router.back()}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Attendance
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="flex h-screen bg-white">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader user={user} />
        <main className="flex-1 overflow-y-auto p-6 bg-white">
          <div className="max-w-6xl mx-auto">
            {/* Header with back button */}
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.back()}
                className="rounded-lg border-gray-200 hover:bg-gray-50"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Button>
              <h1 className="text-2xl font-semibold text-gray-900">
                {employee.username}'s Attendance
              </h1>
              <p className="text-sm text-gray-500">
                Track and manage attendance records
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <StatCard 
                title="Total Days" 
                value={stats?.totalDays || 0} 
                icon={<Calendar className="h-4 w-4 text-gray-500" />}
                color="bg-blue-50 text-blue-700"
              />
              <StatCard 
                title="Present" 
                value={stats?.presentDays || 0} 
                icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
                color="bg-green-50 text-green-700"
              />
              <StatCard 
                title="Late Arrivals" 
                value={stats?.lateDays || 0} 
                icon={<Clock3 className="h-4 w-4 text-amber-500" />}
                color="bg-amber-50 text-amber-700"
              />
              <StatCard 
                title="Absent" 
                value={stats?.absentDays || 0} 
                icon={<AlertCircle className="h-4 w-4 text-red-500" />}
                color="bg-red-50 text-red-700"
              />
            </div>

            <Card className="overflow-hidden border border-gray-200">
              <div className="p-6 pb-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-medium">Attendance Records</h3>
                    <p className="text-sm text-gray-500">
                      Showing records for the last 90 days
                    </p>
                  </div>
                  <Tabs 
                    value={activeTab} 
                    onValueChange={setActiveTab}
                    className="w-full sm:w-auto"
                  >
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                      <TabsTrigger value="present" className="text-xs">Present</TabsTrigger>
                      <TabsTrigger value="late" className="text-xs">Late</TabsTrigger>
                      <TabsTrigger value="absent" className="text-xs">Absent</TabsTrigger>
                      <TabsTrigger value="withReasons" className="text-xs">With Reasons</TabsTrigger>
                    </TabsList>
                    <TabsContent value="all" className="space-y-8">
                      {Object.keys(groupedAttendance).length > 0 ? (
                        <div className="space-y-8">
                          {Object.entries(groupedAttendance)
                            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                            .map(([monthYear, records]) => (
                              <div key={`month-${monthYear}`} className="space-y-3">
                                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                                  {monthYear}
                                </h4>
                                <div className="space-y-2">
                                  {(records as any[]).map((record) => (
                                    <div
                                      key={`record-${record._id || record.date}`}
                                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border ${
                                        isToday(record.date) 
                                          ? 'border-blue-200 bg-blue-50' 
                                          : 'border-gray-100 hover:bg-gray-50'
                                      } transition-colors`}
                                    >
                                      <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                          <div className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${
                                            isToday(record.date) 
                                              ? 'bg-blue-100 text-blue-600' 
                                              : 'bg-gray-100 text-gray-600'
                                          }`}>
                                            <Calendar className="h-5 w-5" />
                                          </div>
                                          <div>
                                            <p className={`font-medium ${
                                              isToday(record.date) ? 'text-blue-800' : 'text-gray-900'
                                            }`}>
                                              {format(record.date, 'EEEE, MMMM d, yyyy')}
                                              {isToday(record.date) && (
                                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                  Today
                                                </span>
                                              )}
                                            </p>
                                            {record.notes && (
                                              <p className="text-sm text-gray-500 mt-1">
                                                {record.notes}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="mt-3 sm:mt-0 flex items-center gap-4">
                                        {record.hoursWorked && (
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <div className="flex items-center text-sm text-gray-500">
                                                  <Clock className="h-4 w-4 mr-1.5 text-gray-400" />
                                                  {record.hoursWorked} hours
                                                </div>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>Hours worked</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        )}
                                        {getStatusBadge(record.status)}
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => openEditModal(record)}
                                        >
                                          Edit
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="py-12 text-center">
                          <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
                            <User className="h-full w-full opacity-40" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-1">No attendance records</h3>
                          <p className="text-gray-500 mb-6 max-w-md mx-auto">
                            {activeTab === 'all' 
                              ? 'No attendance records found for this employee.' 
                              : `No ${activeTab.toLowerCase()} records found for this employee.`}
                          </p>
                          <Button 
                            variant="outline"
                            onClick={() => setActiveTab("all")}
                          >
                            View all records
                          </Button>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="present" className="space-y-8">
                      {filteredAttendance.some((r: any) => r.status?.toLowerCase() === 'present') ? (
                        <div className="space-y-8">
                          {/* Present records content */}
                        </div>
                      ) : (
                        <div className="py-12 text-center">
                          <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
                            <User className="h-full w-full opacity-40" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-1">No present records</h3>
                          <p className="text-gray-500">No present records found for this employee.</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="late" className="space-y-8">
                      {filteredAttendance.some((r: any) => r.status?.toLowerCase() === 'late') ? (
                        <div className="space-y-8">
                          {/* Late records content */}
                        </div>
                      ) : (
                        <div className="py-12 text-center">
                          <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
                            <User className="h-full w-full opacity-40" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-1">No late records</h3>
                          <p className="text-gray-500">No late records found for this employee.</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="absent" className="space-y-8">
                      {filteredAttendance.some((r: any) => r.status?.toLowerCase() === 'absent') ? (
                        <div className="space-y-8">
                          {/* Absent records content */}
                        </div>
                      ) : (
                        <div className="py-12 text-center">
                          <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
                            <User className="h-full w-full opacity-40" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-1">No absent records</h3>
                          <p className="text-gray-500">No absent records found for this employee.</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="withReasons" className="space-y-4">
                      {isLoadingAttendance ? (
                        <div className="space-y-4">
                          {[1, 2, 3].map((i) => (
                            <Skeleton key={`skeleton-${i}`} className="h-20 w-full" />
                          ))}
                        </div>
                      ) : attendancesWithReasons?.length > 0 ? (
                        <div className="space-y-4">
                          {attendancesWithReasons.map((record: any) => (
                            <Card key={`attendance-${record._id}-${record.date}`}>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">
                                      {format(parseISO(record.date), 'EEEE, MMMM d, yyyy')}
                                    </p>
                                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                                      <Clock3 className="h-4 w-4 mr-1" />
                                      <span>Status: {record.status}</span>
                                    </div>
                                    {record.reason && (
                                      <div className="mt-2">
                                        <p className="text-sm font-medium">Reason:</p>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                          {record.reason}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleViewReason(record)}
                                  >
                                    View Details
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>No attendance records with reasons found for the selected period.</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
              
              <Separator className="mt-6" />
              
              <div className="p-6 pt-4">
                {/* Existing content */}
              </div>
              
              {Object.keys(groupedAttendance).length > 0 && (
                <CardFooter className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Showing {filteredAttendance.length} records • Last updated {new Date().toLocaleTimeString()}
                  </p>
                </CardFooter>
              )}
            </Card>
          </div>
        </main>
      </div>
      
      {/* Edit Attendance Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Attendance</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="date" className="text-right">
                Date
              </label>
              <div className="col-span-3">
                {selectedAttendance && format(
                  typeof selectedAttendance.date === 'string' 
                    ? parseISO(selectedAttendance.date) 
                    : selectedAttendance.date, 
                  'PPP'
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="status" className="text-right">
                Status
              </label>
              <Select 
                value={selectedStatus} 
                onValueChange={setSelectedStatus}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              onClick={handleUpdateAttendance}
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reason Details Modal */}
      <Dialog open={isReasonModalOpen} onOpenChange={setIsReasonModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Attendance Details</DialogTitle>
          </DialogHeader>
          {selectedReason && (
            <div className="space-y-4 py-4">
              <div>
                <h4 className="font-medium">Date</h4>
                <p className="text-sm text-muted-foreground">
                  {format(parseISO(selectedReason.date), 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
              <div>
                <h4 className="font-medium">Status</h4>
                <div className="flex items-center mt-1">
                  {selectedReason.status === 'present' && (
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                  )}
                  {selectedReason.status === 'late' && (
                    <Clock3 className="h-4 w-4 text-yellow-500 mr-2" />
                  )}
                  {selectedReason.status === 'absent' && (
                    <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                  )}
                  <span className="capitalize">{selectedReason.status}</span>
                </div>
              </div>
              {selectedReason.reason && (
                <div>
                  <h4 className="font-medium">Reason</h4>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                    {selectedReason.reason}
                  </p>
                </div>
              )}
              {selectedReason.notes && (
                <div>
                  <h4 className="font-medium">Additional Notes</h4>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                    {selectedReason.notes}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {selectedReason.checkIn && (
                  <div>
                    <h4 className="font-medium">Check In</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedReason.checkIn), 'h:mm a')}
                    </p>
                  </div>
                )}
                {selectedReason.checkOut && (
                  <div>
                    <h4 className="font-medium">Check Out</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedReason.checkOut), 'h:mm a')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsReasonModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, icon, color }: { 
  title: string; 
  value: number; 
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card className="overflow-hidden border border-gray-200 hover:shadow-sm transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-semibold mt-1">{value}</p>
          </div>
          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${color}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
