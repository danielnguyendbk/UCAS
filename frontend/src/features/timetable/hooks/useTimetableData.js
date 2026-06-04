import { useEffect, useState } from "react";
import { timetableService } from "../services/timetableService";
const useTimetableData = () => {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const loadData = async () => {
      const data = await timetableService.getTimetableItems();
      setItems(data);
    };
    void loadData();
  }, []);
  return { items };
};
export {
  useTimetableData
};
