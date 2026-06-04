import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Clock, MapPin, User, X } from "lucide-react";
const TIME_SLOTS = [
  { key: "Ti\u1EBFt 1-3", label: "Ti\u1EBFt 1\u20133", time: "07:00 \u2013 09:30" },
  { key: "Ti\u1EBFt 4-6", label: "Ti\u1EBFt 4\u20136", time: "09:45 \u2013 12:15" },
  { key: "Ti\u1EBFt 7-9", label: "Ti\u1EBFt 7\u20139", time: "13:00 \u2013 15:30" },
  { key: "Ti\u1EBFt 10-12", label: "Ti\u1EBFt 10\u201312", time: "15:45 \u2013 18:15" }
];
const WEEK_DAYS = ["Th\u1EE9 2", "Th\u1EE9 3", "Th\u1EE9 4", "Th\u1EE9 5", "Th\u1EE9 6", "Th\u1EE9 7"];
function normalizeSlot(slot) {
  const m = slot.match(/Tiết\s*(\d+)/i);
  if (!m) return slot;
  const n = parseInt(m[1], 10);
  if (n <= 3) return "Ti\u1EBFt 1-3";
  if (n <= 6) return "Ti\u1EBFt 4-6";
  if (n <= 9) return "Ti\u1EBFt 7-9";
  return "Ti\u1EBFt 10-12";
}
const colorMap = {
  blue: { wrap: "bg-blue-50", border: "border-l-blue-500", title: "text-blue-900", sub: "text-blue-600", dot: "bg-blue-500" },
  green: { wrap: "bg-green-50", border: "border-l-green-500", title: "text-green-900", sub: "text-green-600", dot: "bg-green-500" },
  red: { wrap: "bg-red-50", border: "border-l-red-500", title: "text-red-900", sub: "text-red-600", dot: "bg-red-500" },
  orange: { wrap: "bg-orange-50", border: "border-l-orange-500", title: "text-orange-900", sub: "text-orange-600", dot: "bg-orange-500" },
  purple: { wrap: "bg-purple-50", border: "border-l-purple-500", title: "text-purple-900", sub: "text-purple-600", dot: "bg-purple-500" },
  teal: { wrap: "bg-teal-50", border: "border-l-teal-500", title: "text-teal-900", sub: "text-teal-600", dot: "bg-teal-500" },
  gray: { wrap: "bg-gray-100", border: "border-l-gray-400", title: "text-gray-600", sub: "text-gray-400", dot: "bg-gray-400" }
};
function BlockDetailModal({
  item,
  onClose
}) {
  const c = colorMap[item.color ?? "blue"];
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: "fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4",
      onClick: onClose,
      children: /* @__PURE__ */ jsxs(
        "div",
        {
          className: "bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden",
          onClick: (e) => e.stopPropagation(),
          children: [
            /* @__PURE__ */ jsxs("div", { className: `${c.wrap} ${c.border} border-l-4 px-5 py-4 flex items-start justify-between gap-4`, children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: `text-sm font-bold ${c.title}`, children: item.name }),
                item.subLabel && /* @__PURE__ */ jsx("p", { className: `text-xs font-mono mt-0.5 ${c.sub}`, children: item.subLabel })
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: onClose,
                  className: "text-gray-400 hover:text-gray-600 mt-0.5 flex-shrink-0",
                  children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" })
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-5 space-y-3", children: [
              [
                item.detail1 && { icon: User, label: "Th\xF4ng tin", value: item.detail1 },
                item.detail2 && { icon: MapPin, label: "\u0110\u1ECBa \u0111i\u1EC3m", value: item.detail2 },
                item.time && { icon: Clock, label: "Gi\u1EDD h\u1ECDc", value: item.time },
                { icon: Clock, label: "Ca h\u1ECDc", value: item.slot },
                { icon: Clock, label: "Th\u1EE9", value: item.day }
              ].filter(Boolean).map((row) => {
                const Icon = row.icon;
                return /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-100", children: /* @__PURE__ */ jsx(Icon, { className: "w-3.5 h-3.5 text-gray-400" }) }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "text-[11px] text-gray-400", children: row.label }),
                    /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold text-gray-800", children: row.value })
                  ] })
                ] }, row.label);
              }),
              item.badge && /* @__PURE__ */ jsxs("div", { className: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${c.wrap} ${c.title} border border-current/20 mt-1`, children: [
                /* @__PURE__ */ jsx("span", { className: `w-1.5 h-1.5 rounded-full ${c.dot}` }),
                item.badge
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: onClose,
                  className: "w-full mt-2 py-2 text-xs font-medium border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors",
                  children: "\u0110\xF3ng"
                }
              )
            ] })
          ]
        }
      )
    }
  );
}
function ScheduleGridView({ items, onItemClick, compactDays = false }) {
  const [activeItem, setActiveItem] = useState(null);
  const lookup = /* @__PURE__ */ new Map();
  items.forEach((item) => {
    const slotKey = normalizeSlot(item.slot);
    const key = `${slotKey}||${item.day}`;
    if (!lookup.has(key)) lookup.set(key, []);
    lookup.get(key).push(item);
  });
  const daysToShow = compactDays ? WEEK_DAYS.filter((d) => items.some((i) => i.day === d)) : WEEK_DAYS;
  const handleClick = (item) => {
    setActiveItem(item);
    onItemClick?.(item);
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("div", { className: "overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white", children: /* @__PURE__ */ jsxs("div", { style: { minWidth: `${120 + daysToShow.length * 148}px` }, children: [
      /* @__PURE__ */ jsxs(
        "div",
        {
          className: "grid bg-gray-50 border-b border-gray-200",
          style: { gridTemplateColumns: `120px repeat(${daysToShow.length}, 1fr)` },
          children: [
            /* @__PURE__ */ jsx("div", { className: "px-3 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wide border-r border-gray-200", children: "Ca / Th\u1EE9" }),
            daysToShow.map((day) => /* @__PURE__ */ jsx(
              "div",
              {
                className: "py-3 px-2 text-center text-xs font-semibold text-gray-700 border-r border-gray-200 last:border-r-0",
                children: day
              },
              day
            ))
          ]
        }
      ),
      TIME_SLOTS.map((ts, tsIdx) => {
        const hasAny = daysToShow.some(
          (d) => lookup.has(`${ts.key}||${d}`)
        );
        return /* @__PURE__ */ jsxs(
          "div",
          {
            className: `grid border-b border-gray-100 last:border-b-0 ${tsIdx % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`,
            style: { gridTemplateColumns: `120px repeat(${daysToShow.length}, 1fr)` },
            children: [
              /* @__PURE__ */ jsxs("div", { className: "px-3 py-3 border-r border-gray-200 flex flex-col justify-center min-h-[90px]", children: [
                /* @__PURE__ */ jsx("p", { className: "text-[11px] font-bold text-gray-700", children: ts.label }),
                /* @__PURE__ */ jsx("p", { className: "text-[10px] text-gray-400 mt-0.5 leading-tight", children: ts.time })
              ] }),
              daysToShow.map((day) => {
                const cellItems = lookup.get(`${ts.key}||${day}`) ?? [];
                return /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: "p-1.5 border-r border-gray-100 last:border-r-0 min-h-[90px] flex flex-col gap-1",
                    children: cellItems.length === 0 ? /* @__PURE__ */ jsx("div", { className: "flex-1 flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "w-1 h-1 rounded-full bg-gray-200" }) }) : cellItems.map((item) => {
                      const c = colorMap[item.color ?? "blue"];
                      return /* @__PURE__ */ jsxs(
                        "button",
                        {
                          onClick: () => handleClick(item),
                          className: `w-full text-left rounded-lg border-l-[3px] px-2 py-1.5 transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.99] ${c.wrap} ${c.border} group`,
                          children: [
                            /* @__PURE__ */ jsx("p", { className: `text-[11px] font-bold leading-tight truncate ${c.title}`, children: item.name }),
                            item.subLabel && /* @__PURE__ */ jsx("p", { className: `text-[10px] font-mono truncate mt-0.5 ${c.sub}`, children: item.subLabel }),
                            item.detail1 && /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-gray-500 truncate mt-0.5 flex items-center gap-0.5", children: [
                              /* @__PURE__ */ jsx(User, { className: "w-2.5 h-2.5 flex-shrink-0 text-gray-400" }),
                              item.detail1
                            ] }),
                            item.detail2 && /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-gray-500 truncate flex items-center gap-0.5", children: [
                              /* @__PURE__ */ jsx(MapPin, { className: "w-2.5 h-2.5 flex-shrink-0 text-gray-400" }),
                              item.detail2
                            ] }),
                            item.badge && /* @__PURE__ */ jsxs("div", { className: `mt-1 inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${c.sub} bg-white/60`, children: [
                              /* @__PURE__ */ jsx("span", { className: `w-1.5 h-1.5 rounded-full ${c.dot}` }),
                              item.badge
                            ] })
                          ]
                        },
                        item.id
                      );
                    })
                  },
                  day
                );
              })
            ]
          },
          ts.key
        );
      })
    ] }) }),
    activeItem && /* @__PURE__ */ jsx(BlockDetailModal, { item: activeItem, onClose: () => setActiveItem(null) })
  ] });
}
export {
  ScheduleGridView,
  TIME_SLOTS,
  WEEK_DAYS,
  normalizeSlot
};
