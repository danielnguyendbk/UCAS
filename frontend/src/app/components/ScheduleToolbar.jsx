import { Search, RotateCw, CalendarDays, Building2, MapPin } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

const ScheduleToolbar = ({ 
  onSearch, 
  onRefresh, 
  onBuildingChange,
  onRoomChange,
  onWeekChange,
  onDateChange,
  filters = {
    building: "all",
    room: "all",
    week: "15",
    date: "2026-04-24"
  },
  buildings = ["Tòa A", "Tòa B", "Tòa C", "Tòa D", "Tòa E"],
  rooms = ["A-101", "A-301", "B-105", "B-201", "C-105", "C-201", "D-102", "D-302"],
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-300">
      {/* Building Filter */}
      <Select value={filters.building} onValueChange={onBuildingChange}>
        <SelectTrigger className="w-[140px] h-9 bg-gray-50 border-gray-200 text-xs font-semibold focus:ring-1 focus:ring-blue-500">
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-gray-400" />
            <SelectValue placeholder="Tòa nhà" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả tòa</SelectItem>
          {buildings.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
        </SelectContent>
      </Select>

      {/* Room Filter */}
      <Select value={filters.room} onValueChange={onRoomChange}>
        <SelectTrigger className="w-[140px] h-9 bg-gray-50 border-gray-200 text-xs font-semibold focus:ring-1 focus:ring-blue-500">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-gray-400" />
            <SelectValue placeholder="Phòng" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả phòng</SelectItem>
          {rooms.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
        </SelectContent>
      </Select>

      {/* Week Filter */}
      <Select value={filters.week} onValueChange={onWeekChange}>
        <SelectTrigger className="w-[110px] h-9 bg-gray-50 border-gray-200 text-xs font-semibold focus:ring-1 focus:ring-blue-500">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
            <SelectValue placeholder="Tuần" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: 20 }, (_, i) => i + 1).map(w => (
            <SelectItem key={w} value={String(w)}>Tuần {w}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date Picker */}
      <div className="relative">
        <Input 
          type="date" 
          value={filters.date} 
          onChange={(e) => onDateChange?.(e.target.value)}
          className="h-9 w-[160px] bg-gray-50 border-gray-200 text-xs font-semibold px-3 py-1 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Search Button */}
      <Button 
        onClick={onSearch}
        className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-xs font-bold gap-2 shadow-sm"
      >
        <Search className="w-4 h-4" />
        Tìm kiếm
      </Button>

      {/* Refresh Button */}
      <Button 
        variant="outline" 
        size="icon" 
        onClick={onRefresh}
        className="h-9 w-9 border-gray-200 text-gray-500 hover:bg-gray-50"
      >
        <RotateCw className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default ScheduleToolbar;
