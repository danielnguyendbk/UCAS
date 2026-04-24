import { useMemo, useState } from "react";
const useTimetableFilters = (items) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDay, setFilterDay] = useState("all");
  const [filterRoom, setFilterRoom] = useState("all");
  const [filterLecturer, setFilterLecturer] = useState("all");
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) || item.courseName.toLowerCase().includes(searchTerm.toLowerCase()) || item.lecturer.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDay = filterDay === "all" || item.day === filterDay;
      const matchesRoom = filterRoom === "all" || item.assignedRoom === filterRoom;
      const matchesLecturer = filterLecturer === "all" || item.lecturer === filterLecturer;
      return matchesSearch && matchesDay && matchesRoom && matchesLecturer;
    });
  }, [items, searchTerm, filterDay, filterRoom, filterLecturer]);
  return {
    searchTerm,
    setSearchTerm,
    filterDay,
    setFilterDay,
    filterRoom,
    setFilterRoom,
    filterLecturer,
    setFilterLecturer,
    filteredItems
  };
};
export {
  useTimetableFilters
};
