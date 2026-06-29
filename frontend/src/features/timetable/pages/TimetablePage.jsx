import { jsx, jsxs } from "react/jsx-runtime";
import { TimetableTable } from "../components/TimetableTable";
import { TimetableToolbar } from "../components/TimetableToolbar";
import { useTimetableData } from "../hooks/useTimetableData";
import { useTimetableFilters } from "../hooks/useTimetableFilters";
const TimetablePage = () => {
  const { items } = useTimetableData();
  const {
    searchTerm,
    setSearchTerm,
    filterDay,
    setFilterDay,
    filterRoom,
    setFilterRoom,
    filterLecturer,
    setFilterLecturer,
    filteredItems
  } = useTimetableFilters(items);
  return /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold text-gray-900", children: "Timetable Management" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600 mt-1", children: "Manage course schedules and room assignments" })
    ] }),
    /* @__PURE__ */ jsx(
      TimetableToolbar,
      {
        searchTerm,
        onSearchTermChange: setSearchTerm,
        filterDay,
        onFilterDayChange: setFilterDay,
        filterRoom,
        onFilterRoomChange: setFilterRoom,
        filterLecturer,
        onFilterLecturerChange: setFilterLecturer
      }
    ),
    /* @__PURE__ */ jsx(TimetableTable, { items: filteredItems })
  ] });
};
var stdin_default = TimetablePage;
export {
  stdin_default as default
};
