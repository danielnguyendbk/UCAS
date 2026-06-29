import { Search, RotateCw, CalendarDays, Building2, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
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
  showBuildingRoom = true,
  filters = {
    building: "all",
    room: "all",
    week: "15",
    date: "2026-04-24",
  },
  buildings = ["Tòa A", "Tòa B", "Tòa C", "Tòa D", "Tòa E"],
  rooms = ["A-101", "A-301", "B-105", "B-201", "C-105", "C-201", "D-102", "D-302"],
  weekOptions = Array.from({ length: 20 }, (_, index) => String(index + 1)),
}) => {
  const currentWeekIndex = weekOptions.findIndex((week) => week === filters.week);
  const goToWeekOffset = (offset) => {
    const nextIndex = currentWeekIndex + offset;
    if (nextIndex < 0 || nextIndex >= weekOptions.length) return;
    onWeekChange?.(weekOptions[nextIndex]);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm animate-in fade-in slide-in-from-top-1 duration-300">
      {showBuildingRoom && (
        <Select value={filters.building} onValueChange={onBuildingChange}>
          <SelectTrigger className="h-9 w-[140px] bg-gray-50 text-xs font-semibold focus:ring-1 focus:ring-blue-500">
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-gray-400" />
              <SelectValue placeholder="Tòa nhà" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả tòa</SelectItem>
            {buildings.map((building) => (
              <SelectItem key={building} value={building}>{building}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {showBuildingRoom && (
        <Select value={filters.room} onValueChange={onRoomChange}>
          <SelectTrigger className="h-9 w-[140px] bg-gray-50 text-xs font-semibold focus:ring-1 focus:ring-blue-500">
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-gray-400" />
              <SelectValue placeholder="Phòng" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả phòng</SelectItem>
            {rooms.map((room) => (
              <SelectItem key={room} value={room}>{room}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => goToWeekOffset(-1)}
          disabled={currentWeekIndex <= 0}
          className="h-9 w-9 border-gray-200 text-gray-500 hover:bg-gray-50"
          title="Tuần trước"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Select value={filters.week} onValueChange={onWeekChange}>
          <SelectTrigger className="h-9 w-[110px] bg-gray-50 text-xs font-semibold focus:ring-1 focus:ring-blue-500">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
              <SelectValue placeholder="Tuần" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {weekOptions.map((week) => (
              <SelectItem key={week} value={week}>Tuần {week}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => goToWeekOffset(1)}
          disabled={currentWeekIndex < 0 || currentWeekIndex >= weekOptions.length - 1}
          className="h-9 w-9 border-gray-200 text-gray-500 hover:bg-gray-50"
          title="Tuần sau"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="relative">
        <Input
          type="date"
          value={filters.date}
          onChange={(event) => onDateChange?.(event.target.value)}
          className="h-9 w-[160px] bg-gray-50 px-3 py-1 text-xs font-semibold focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <Button
        onClick={onSearch}
        className="h-9 gap-2 bg-blue-600 px-4 text-xs font-bold shadow-sm hover:bg-blue-700"
      >
        <Search className="h-4 w-4" />
        Tìm kiếm
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={onRefresh}
        className="h-9 w-9 border-gray-200 text-gray-500 hover:bg-gray-50"
      >
        <RotateCw className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ScheduleToolbar;
