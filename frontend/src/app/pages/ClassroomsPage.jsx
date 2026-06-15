import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { AlertCircle, Loader2, MapPin, Monitor, Plus, Search, Users } from "lucide-react";
import { httpClient } from "../../services/httpClient";

const getResponseData = (response) => {
  const payload = response?.data?.data ?? response?.data ?? [];
  return Array.isArray(payload) ? payload : [];
};

const getFacilities = (room) => [
  room.hasProjector && "May chieu",
  room.hasAc && "Dieu hoa",
  room.roomType && `Loai: ${room.roomType}`,
].filter(Boolean);

const ClassroomsPage = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadClassrooms = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await httpClient.get("/api/categories/classrooms");
        if (isMounted) setClassrooms(getResponseData(response));
      } catch (err) {
        if (isMounted) {
          setError(err?.response?.data?.message || "Khong the tai danh sach phong hoc.");
          setClassrooms([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadClassrooms();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredClassrooms = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return classrooms;
    return classrooms.filter((room) => {
      const text = [
        room.roomName,
        room.roomNumber,
        room.buildingCode,
        room.buildingName,
        room.roomType,
      ].join(" ").toLowerCase();
      return text.includes(query);
    });
  }, [classrooms, searchTerm]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Phong hoc</h1>
          <p className="mt-1 text-gray-600">Du lieu phong hoc lay tu database.</p>
        </div>
        <Button disabled className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          Them phong
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Tim theo phong, toa nha, loai phong..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading && (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm font-semibold text-gray-600">Dang tai phong hoc...</p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-400" />
          <p className="text-sm font-bold text-red-700">{error}</p>
        </div>
      )}

      {!loading && !error && filteredClassrooms.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-sm font-semibold text-gray-500">Khong co phong hoc phu hop.</p>
        </div>
      )}

      {!loading && !error && filteredClassrooms.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClassrooms.map((room) => {
            const facilities = getFacilities(room);
            const roomLabel = room.roomName || room.roomNumber || `Phong ${room.id}`;
            return (
              <Card key={room.id} className="transition-shadow hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{roomLabel}</h3>
                      <div className="mt-1 flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        {room.buildingName || room.buildingCode || "Chua co toa"} - Tang {room.floorNumber || "-"}
                      </div>
                    </div>
                    <Badge className={room.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                      {room.active ? "Dang dung" : "Tam dung"}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-900">Suc chua:</span>
                      <span className="text-gray-600">{room.capacity || 0} sinh vien</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Monitor className="mt-0.5 h-4 w-4 text-gray-500" />
                      <div>
                        <span className="font-medium text-gray-900">Thiet bi:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {facilities.length > 0
                            ? facilities.map((facility) => (
                              <Badge key={facility} variant="outline" className="text-xs">
                                {facility}
                              </Badge>
                            ))
                            : <span className="text-xs text-gray-400">Chua cap nhat</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2 border-t border-gray-200 pt-4">
                    <Button variant="outline" size="sm" className="flex-1" disabled>Sua</Button>
                    <Button variant="outline" size="sm" className="flex-1" disabled>Xem lich</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export { ClassroomsPage };
