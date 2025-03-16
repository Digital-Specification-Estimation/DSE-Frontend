import React from "react";
import { Search, BellDot, Gift } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
const DashboardHeader: React.FC = () => {
  return (
    <header className="bg-white border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="relative w-52">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search"
            className="pl-10 h-9 w-full border border-gray-300 rounded-2xl"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className=" border-r border-gray-300 h-8 w-16 flex justify-center items-center">
            <div className=" border h-9 w-9 border-gray-300 flex items-center justify-center rounded-full">
              <BellDot />
            </div>
          </div>
          <Button className="bg-blue-700 hover:bg-blue-800 text-white rounded-full">
            <Gift className="h-4 w-4 mr-2" />
            Total Payroll $25,000
          </Button>
        </div>
      </div>
    </header>
  );
};
export default DashboardHeader;






