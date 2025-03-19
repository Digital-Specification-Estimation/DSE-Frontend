"use client"

import { useState, useEffect } from "react"
import { Search, Upload, Plus, User, DollarSign, Loader2 } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import DashboardHeader from "@/components/DashboardHeader"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

// Types
interface Employee {
  id: number
  name: string
  avatar: string
  position: string
  assignedProject: string
  contractStartDate: string
  contractEndDate: string
  dailyRate: number
  accountNumber: string
}

export default function EmployeeManagement() {
  const { toast } = useToast()
  const [user] = useState({
    name: "Kristin Watson",
    role: "Personal Account",
    avatar: "/placeholder.svg?height=40&width=40",
  })

  const [showAddEmployee, setShowAddEmployee] = useState(false)
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([])
  const [filters, setFilters] = useState({
    trade: "",
    project: "",
    dailyRate: "",
    search: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])

  const [newEmployee, setNewEmployee] = useState({
    name: "",
    position: "",
    assignedProject: "",
    startDate: "",
    endDate: "",
    accountNumber: "",
    dailyRate: "",
  })

  // Fetch employee data
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoading(true)
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // In a real implementation, this would be:
        // const response = await fetch('/api/employees');
        // const data = await response.json();
        // setEmployees(data);

        // Sample data for now
        setEmployees([
          {
            id: 1,
            name: "Courtney Henry",
            avatar: "/placeholder.svg?height=40&width=40",
            position: "Electrician",
            assignedProject: "Metro Bridge",
            contractStartDate: "Feb 28, 2018",
            contractEndDate: "Feb 28, 2018",
            dailyRate: 120,
            accountNumber: "12345678",
          },
          {
            id: 2,
            name: "Annette Black",
            avatar: "/placeholder.svg?height=40&width=40",
            position: "Electrician",
            assignedProject: "Mall Construction",
            contractStartDate: "May 31, 2015",
            contractEndDate: "May 20, 2015",
            dailyRate: 120,
            accountNumber: "87654321",
          },
          {
            id: 3,
            name: "Kathryn Murphy",
            avatar: "/placeholder.svg?height=40&width=40",
            position: "HR Manager",
            assignedProject: "Metro Bridge",
            contractStartDate: "May 12, 2019",
            contractEndDate: "Nov 16, 2014",
            dailyRate: 200,
            accountNumber: "12345678",
          },
          {
            id: 4,
            name: "Courtney Henry",
            avatar: "/placeholder.svg?height=40&width=40",
            position: "Electrician",
            assignedProject: "Mall Construction",
            contractStartDate: "Sep 9, 2013",
            contractEndDate: "May 29, 2017",
            dailyRate: 120,
            accountNumber: "87654321",
          },
          {
            id: 5,
            name: "Brooklyn Simmons",
            avatar: "/placeholder.svg?height=40&width=40",
            position: "HR Manager",
            assignedProject: "Metro Bridge",
            contractStartDate: "Jul 14, 2015",
            contractEndDate: "May 12, 2019",
            dailyRate: 200,
            accountNumber: "12345678",
          },
          {
            id: 6,
            name: "Marvin McKinney",
            avatar: "/placeholder.svg?height=40&width=40",
            position: "Technician",
            assignedProject: "Mall Construction",
            contractStartDate: "Sep 24, 2017",
            contractEndDate: "Dec 2, 2018",
            dailyRate: 140,
            accountNumber: "87654321",
          },
          {
            id: 7,
            name: "Jane Cooper",
            avatar: "/placeholder.svg?height=40&width=40",
            position: "Construction Worker",
            assignedProject: "Metro Bridge",
            contractStartDate: "Mar 6, 2018",
            contractEndDate: "Apr 28, 2016",
            dailyRate: 100,
            accountNumber: "12345678",
          },
          {
            id: 8,
            name: "Kristin Watson",
            avatar: "/placeholder.svg?height=40&width=40",
            position: "Technician",
            assignedProject: "Mall Construction",
            contractStartDate: "Aug 2, 2013",
            contractEndDate: "Feb 29, 2012",
            dailyRate: 140,
            accountNumber: "87654321",
          },
          {
            id: 9,
            name: "Jacob Jones",
            avatar: "/placeholder.svg?height=40&width=40",
            position: "Construction Worker",
            assignedProject: "Metro Bridge",
            contractStartDate: "Aug 7, 2017",
            contractEndDate: "May 31, 2015",
            dailyRate: 100,
            accountNumber: "12345678",
          },
          {
            id: 10,
            name: "Esther Howard",
            avatar: "/placeholder.svg?height=40&width=40",
            position: "Technician",
            assignedProject: "Mall Construction",
            contractStartDate: "May 6, 2012",
            contractEndDate: "Mar 13, 2014",
            dailyRate: 140,
            accountNumber: "87654321",
          },
          {
            id: 11,
            name: "Arlene McCoy",
            avatar: "/placeholder.svg?height=40&width=40",
            position: "Construction Worker",
            assignedProject: "Metro Bridge",
            contractStartDate: "Oct 30, 2017",
            contractEndDate: "Mar 23, 2013",
            dailyRate: 100,
            accountNumber: "12345678",
          },
          {
            id: 12,
            name: "Darrell Steward",
            avatar: "/placeholder.svg?height=40&width=40",
            position: "Construction Worker",
            assignedProject: "Mall Construction",
            contractStartDate: "Nov 7, 2017",
            contractEndDate: "Oct 31, 2017",
            dailyRate: 100,
            accountNumber: "87654321",
          },
        ])

        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching employees:", error)
        toast({
          title: "Error",
          description: "Failed to load employee data. Please try again.",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }

    fetchEmployees()
  }, [toast])

  // Filter employees based on selected filters
  const filteredEmployees = employees.filter((employee) => {
    if (filters.trade && employee.position !== filters.trade) return false
    if (filters.project && employee.assignedProject !== filters.project) return false
    if (filters.dailyRate && `$${employee.dailyRate}` !== filters.dailyRate) return false
    if (filters.search && !employee.position.toLowerCase().includes(filters.search.toLowerCase())) return false
    return true
  })

  // Handle bulk selection
  const handleSelectAll = (checked: boolean) => {
    setSelectedEmployees(checked ? employees.map((e) => e.id) : [])
    toast({
      title: checked ? "All Selected" : "All Deselected",
      description: checked ? "All employees have been selected." : "All employees have been deselected.",
    })
  }

  const handleSelectEmployee = (id: number, checked: boolean) => {
    setSelectedEmployees((prev) => (checked ? [...prev, id] : prev.filter((employeeId) => employeeId !== id)))
    const employee = employees.find((e) => e.id === id)
    if (employee) {
      toast({
        title: checked ? "Employee Selected" : "Employee Deselected",
        description: `${employee.name} has been ${checked ? "selected" : "deselected"}.`,
      })
    }
  }

  const handleAddEmployee = async () => {
    try {
      if (!newEmployee.name || !newEmployee.position || !newEmployee.dailyRate) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        })
        return
      }

      setIsSaving(true)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // In a real implementation, this would be:
      // const response = await fetch('/api/employees', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(newEmployee),
      // });
      // const data = await response.json();

      // Add new employee to state
      const newId = Math.max(...employees.map((emp) => emp.id), 0) + 1
      const newEmployeeData: Employee = {
        id: newId,
        name: newEmployee.name,
        avatar: "/placeholder.svg?height=40&width=40",
        position: newEmployee.position,
        assignedProject: newEmployee.assignedProject || "Unassigned",
        contractStartDate: newEmployee.startDate || "Not set",
        contractEndDate: newEmployee.endDate || "Not set",
        dailyRate: Number(newEmployee.dailyRate) || 0,
        accountNumber: newEmployee.accountNumber || "Not set",
      }

      setEmployees([...employees, newEmployeeData])
      setIsSaving(false)
      setShowAddEmployee(false)

      // Reset form
      setNewEmployee({
        name: "",
        position: "",
        assignedProject: "",
        startDate: "",
        endDate: "",
        accountNumber: "",
        dailyRate: "",
      })

      toast({
        title: "Employee Added",
        description: `${newEmployee.name} has been added successfully.`,
      })
    } catch (error) {
      console.error("Error adding employee:", error)
      toast({
        title: "Error",
        description: "Failed to add employee. Please try again.",
        variant: "destructive",
      })
      setIsSaving(false)
    }
  }

  const handleFilterChange = (type: string, value: string) => {
    setFilters((prev) => ({ ...prev, [type]: value }))
    toast({
      title: "Filter Applied",
      description: `Filtered by ${type}: ${value}`,
    })
  }

  const handleUploadCSV = () => {
    toast({
      title: "CSV Upload",
      description: "CSV upload functionality will be implemented soon.",
    })
  }

  const trades = ["Electrician", "HR Manager", "Technician", "Construction Worker"]
  const projects = ["Metro Bridge", "Mall Construction"]
  const dailyRates = ["$100", "$120", "$140", "$200"]

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar user={user} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader />
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              <p className="text-sm text-gray-500">Loading employee data...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Employee Management</h1>

            <div className="flex gap-2">
              <Button variant="outline" className="gap-2 h-12 rounded-full" onClick={handleUploadCSV}>
                <Upload className="h-4 w-4" />
                Upload CSV
              </Button>
              <Button
                onClick={() => {
                  setShowAddEmployee(true)
                  toast({
                    title: "Add Employee",
                    description: "Please fill in the employee details.",
                  })
                }}
                className="bg-orange-400 hover:bg-orange-500 gap-2 h-12 rounded-full"
              >
                <Plus className="h-4 w-4" />
                Add New Employee
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg border">
            {/* Filters */}
            <div className="p-4 flex gap-4 rounded-lg">
              <Select onValueChange={(value) => handleFilterChange("trade", value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select by Trade" />
                </SelectTrigger>
                <SelectContent>
                  {trades.map((trade) => (
                    <SelectItem key={trade} value={trade}>
                      {trade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select onValueChange={(value) => handleFilterChange("project", value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select by Project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project} value={project}>
                      {project}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select onValueChange={(value) => handleFilterChange("dailyRate", value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select by Daily Rate" />
                </SelectTrigger>
                <SelectContent>
                  {dailyRates.map((rate) => (
                    <SelectItem key={rate} value={rate}>
                      {rate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative w-64 ml-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground " />
                <Input
                  type="search"
                  placeholder="Search trade/position..."
                  className="pl-10 h-9 w-full rounded-full"
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-t border-b text-sm text-muted-foreground">
                    <th className="w-10 px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                        checked={selectedEmployees.length === employees.length && employees.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-[10px]">Employee Name</th>
                    <th className="px-4 py-3 text-left text-[10px]">Position/Trade</th>
                    <th className="px-4 py-3 text-left text-[10px]">Assigned Project</th>
                    <th className="px-4 py-3 text-left text-[10px]">Contract Start Date</th>
                    <th className="px-4 py-3 text-left text-[10px]">Contract Finish Date</th>
                    <th className="px-4 py-3 text-left text-[10px]">Daily Rate</th>
                    <th className="px-4 py-3 text-left text-[10px]">Account Number</th>
                    <th className="w-10 px-4 py-3 text-left"></th>
                  </tr>
                </thead>
                <tbody className="text-[11px]">
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((employee) => (
                      <tr key={employee.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300"
                            checked={selectedEmployees.includes(employee.id)}
                            onChange={(e) => handleSelectEmployee(employee.id, e.target.checked)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={employee.avatar} alt={employee.name} />
                              <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{employee.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">{employee.position}</td>
                        <td className="px-4 py-3">{employee.assignedProject}</td>
                        <td className="px-4 py-3">{employee.contractStartDate}</td>
                        <td className="px-4 py-3">{employee.contractEndDate}</td>
                        <td className="px-4 py-3">${employee.dailyRate}</td>
                        <td className="px-4 py-3">{employee.accountNumber}</td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              toast({
                                title: "Employee Options",
                                description: `Options for ${employee.name}`,
                              })
                            }}
                          >
                            ...
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                        No employees found matching the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Add Employee Sheet */}
      <Sheet open={showAddEmployee} onOpenChange={setShowAddEmployee}>
        <SheetContent className="sm:max-w-md p-2">
          <SheetHeader>
            <SheetTitle>Adding Employee</SheetTitle>
          </SheetHeader>
          <div className="py-6 overflow-y-auto flex-1 p-2" style={{ maxHeight: "calc(100vh - 10rem)" }}>
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-medium mb-4">Employee details</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Johny William"
                        className="pl-10"
                        value={newEmployee.name}
                        onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Account Number</label>
                    <Input
                      placeholder="12345678"
                      value={newEmployee.accountNumber}
                      onChange={(e) => setNewEmployee({ ...newEmployee, accountNumber: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Position/Trade</label>
                    <Select onValueChange={(value) => setNewEmployee({ ...newEmployee, position: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {trades.map((trade) => (
                          <SelectItem key={trade} value={trade}>
                            {trade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Daily Rate</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Enter rate"
                        className="pl-10"
                        value={newEmployee.dailyRate}
                        onChange={(e) => setNewEmployee({ ...newEmployee, dailyRate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Assign Project</label>
                    <Select onValueChange={(value) => setNewEmployee({ ...newEmployee, assignedProject: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project} value={project}>
                            {project}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Start Date</label>
                      <div className="relative">
                        <Input
                          type="date"
                          className="pr-10"
                          value={newEmployee.startDate}
                          onChange={(e) => setNewEmployee({ ...newEmployee, startDate: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">End Date</label>
                      <div className="relative">
                        <Input
                          type="date"
                          className="pr-10"
                          value={newEmployee.endDate}
                          onChange={(e) => setNewEmployee({ ...newEmployee, endDate: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                Want to upload multiple employees? Use{" "}
                <Link
                  href="#"
                  className="text-primary font-medium"
                  onClick={(e) => {
                    e.preventDefault()
                    setShowAddEmployee(false)
                    toast({
                      title: "CSV Upload",
                      description: "CSV upload functionality will be implemented soon.",
                    })
                  }}
                >
                  CSV instead
                </Link>
              </div>
            </div>
          </div>
          <Button className="w-full bg-orange-500 hover:bg-orange-600" onClick={handleAddEmployee} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Employee"
            )}
          </Button>
        </SheetContent>
      </Sheet>
    </div>
  )
}

