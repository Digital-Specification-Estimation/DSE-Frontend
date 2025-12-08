import * as XLSX from 'xlsx';

export interface EmployeeTemplateRow {
  employee_name: string;
  employee_email: string;
  trade_name: string;
  trade_daily_planned_cost: number;
  trade_monthly_planned_cost: number;
  employee_daily_rate: number;
  employee_monthly_rate: number;
  contract_start_date: string;
  contract_finish_date: string;
  project_name: string;
  project_start_date: string;
  project_end_date: string;
  project_budget: number;
  location_name: string;
}

export function generateEmployeeTemplate() {
  // Sample data with consistent trade rates
  const sampleData: EmployeeTemplateRow[] = [
    {
      employee_name: 'John Doe',
      employee_email: 'john.doe@example.com',
      trade_name: 'Mason',
      trade_daily_planned_cost: 150,
      trade_monthly_planned_cost: 4500,
      employee_daily_rate: 150,
      employee_monthly_rate: 4500,
      contract_start_date: '2024-01-01',
      contract_finish_date: '2024-12-31',
      project_name: 'Metro Bridge Construction',
      project_start_date: '2024-01-01',
      project_end_date: '2024-12-31',
      project_budget: 1000000,
      location_name: 'Downtown Site',
    },
    {
      employee_name: 'Jane Smith',
      employee_email: 'jane.smith@example.com',
      trade_name: 'Mason',
      trade_daily_planned_cost: 150,
      trade_monthly_planned_cost: 4500,
      employee_daily_rate: 150,
      employee_monthly_rate: 4500,
      contract_start_date: '2024-01-15',
      contract_finish_date: '2024-11-30',
      project_name: 'Metro Bridge Construction',
      project_start_date: '2024-01-01',
      project_end_date: '2024-12-31',
      project_budget: 1000000,
      location_name: 'Downtown Site',
    },
    {
      employee_name: 'Mike Johnson',
      employee_email: 'mike.j@example.com',
      trade_name: 'Carpenter',
      trade_daily_planned_cost: 140,
      trade_monthly_planned_cost: 4200,
      employee_daily_rate: 140,
      employee_monthly_rate: 4200,
      contract_start_date: '2024-02-01',
      contract_finish_date: '2024-10-31',
      project_name: 'Mall Construction',
      project_start_date: '2024-02-01',
      project_end_date: '2024-10-31',
      project_budget: 2000000,
      location_name: 'Uptown Location',
    },
    {
      employee_name: 'Sarah Williams',
      employee_email: 'sarah.w@example.com',
      trade_name: 'Carpenter',
      trade_daily_planned_cost: 140,
      trade_monthly_planned_cost: 4200,
      employee_daily_rate: 140,
      employee_monthly_rate: 4200,
      contract_start_date: '2024-01-10',
      contract_finish_date: '2024-12-15',
      project_name: 'Mall Construction',
      project_start_date: '2024-02-01',
      project_end_date: '2024-10-31',
      project_budget: 2000000,
      location_name: 'Uptown Location',
    },
    {
      employee_name: 'Robert Miller',
      employee_email: 'robert.m@example.com',
      trade_name: 'Electrician',
      trade_daily_planned_cost: 160,
      trade_monthly_planned_cost: 4800,
      employee_daily_rate: 160,
      employee_monthly_rate: 4800,
      contract_start_date: '2024-03-01',
      contract_finish_date: '2024-09-30',
      project_name: 'Factory Expansion',
      project_start_date: '2024-03-01',
      project_end_date: '2024-09-30',
      project_budget: 1500000,
      location_name: 'Industrial Park',
    },
    {
      employee_name: 'Emily Davis',
      employee_email: 'emily.d@example.com',
      trade_name: 'Plumber',
      trade_daily_planned_cost: 155,
      trade_monthly_planned_cost: 4650,
      employee_daily_rate: 155,
      employee_monthly_rate: 4650,
      contract_start_date: '2024-01-20',
      contract_finish_date: '2024-11-20',
      project_name: 'Factory Expansion',
      project_start_date: '2024-03-01',
      project_end_date: '2024-09-30',
      project_budget: 1500000,
      location_name: 'Industrial Park',
    },
    {
      employee_name: 'David Brown',
      employee_email: 'david.b@example.com',
      trade_name: 'Welder',
      trade_daily_planned_cost: 170,
      trade_monthly_planned_cost: 5100,
      employee_daily_rate: 170,
      employee_monthly_rate: 5100,
      contract_start_date: '2024-01-05',
      contract_finish_date: '2024-12-20',
      project_name: 'Residential Tower',
      project_start_date: '2024-01-05',
      project_end_date: '2024-12-20',
      project_budget: 3000000,
      location_name: 'Riverside Complex',
    },
    {
      employee_name: 'Lisa Anderson',
      employee_email: 'lisa.a@example.com',
      trade_name: 'Painter',
      trade_daily_planned_cost: 130,
      trade_monthly_planned_cost: 3900,
      employee_daily_rate: 130,
      employee_monthly_rate: 3900,
      contract_start_date: '2024-02-15',
      contract_finish_date: '2024-10-15',
      project_name: 'Residential Tower',
      project_start_date: '2024-01-05',
      project_end_date: '2024-12-20',
      project_budget: 3000000,
      location_name: 'Riverside Complex',
    },
    {
      employee_name: 'James Wilson',
      employee_email: 'james.w@example.com',
      trade_name: 'Foreman',
      trade_daily_planned_cost: 180,
      trade_monthly_planned_cost: 5400,
      employee_daily_rate: 180,
      employee_monthly_rate: 5400,
      contract_start_date: '2024-01-01',
      contract_finish_date: '2024-12-31',
      project_name: 'Metro Bridge Construction',
      project_start_date: '2024-01-01',
      project_end_date: '2024-12-31',
      project_budget: 1000000,
      location_name: 'Downtown Site',
    },
    {
      employee_name: 'Maria Garcia',
      employee_email: 'maria.g@example.com',
      trade_name: 'Laborer',
      trade_daily_planned_cost: 120,
      trade_monthly_planned_cost: 3600,
      employee_daily_rate: 120,
      employee_monthly_rate: 3600,
      contract_start_date: '2024-02-01',
      contract_finish_date: '2024-11-30',
      project_name: 'Mall Construction',
      project_start_date: '2024-02-01',
      project_end_date: '2024-10-31',
      project_budget: 2000000,
      location_name: 'Uptown Location',
    },
  ];

  // Create worksheet from data
  const worksheet = XLSX.utils.json_to_sheet(sampleData);

  // Set column widths for better readability
  const columnWidths = [
    { wch: 20 }, // employee_name
    { wch: 25 }, // employee_email
    { wch: 15 }, // trade_name
    { wch: 22 }, // trade_daily_planned_cost
    { wch: 25 }, // trade_monthly_planned_cost
    { wch: 20 }, // employee_daily_rate
    { wch: 22 }, // employee_monthly_rate
    { wch: 20 }, // contract_start_date
    { wch: 20 }, // contract_finish_date
    { wch: 25 }, // project_name
    { wch: 20 }, // project_start_date
    { wch: 18 }, // project_end_date
    { wch: 15 }, // project_budget
    { wch: 20 }, // location_name
  ];
  worksheet['!cols'] = columnWidths;

  // Create workbook and add worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');

  // Generate Excel file and trigger download
  XLSX.writeFile(workbook, 'employee-bulk-upload-template.xlsx');
}
