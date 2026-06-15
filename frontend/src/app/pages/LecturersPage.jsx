import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2, Mail, Phone, Plus, Search, UserRound } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { httpClient } from "../../services/httpClient";

const getResponseData = (response) => {
  const payload = response?.data?.data ?? response?.data ?? [];
  return Array.isArray(payload) ? payload : [];
};

const LecturersPage = () => {
  const [lecturers, setLecturers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadLecturers = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await httpClient.get("/api/categories/lecturers");
        if (isMounted) setLecturers(getResponseData(response));
      } catch (err) {
        if (isMounted) {
          setError(err?.response?.data?.message || "Khong the tai danh sach giang vien.");
          setLecturers([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadLecturers();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredLecturers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return lecturers;
    return lecturers.filter((lecturer) => {
      const text = [
        lecturer.name,
        lecturer.staffCode,
        lecturer.email,
        lecturer.phone,
        lecturer.departmentName,
        lecturer.departmentCode,
      ].join(" ").toLowerCase();
      return text.includes(query);
    });
  }, [lecturers, searchTerm]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Giang vien</h1>
          <p className="mt-1 text-gray-600">Danh sach giang vien lay tu database.</p>
        </div>
        <Button disabled className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          Them giang vien
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Tim theo ten, ma giang vien, email, khoa..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading && (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm font-semibold text-gray-600">Dang tai giang vien...</p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-400" />
          <p className="text-sm font-bold text-red-700">{error}</p>
        </div>
      )}

      {!loading && !error && filteredLecturers.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <UserRound className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm font-semibold text-gray-500">Khong co giang vien phu hop.</p>
        </div>
      )}

      {!loading && !error && filteredLecturers.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredLecturers.map((lecturer) => (
            <Card key={lecturer.id} className="transition-shadow hover:shadow-lg">
              <CardContent className="p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-semibold text-gray-900">
                      {lecturer.name || lecturer.staffCode || `GV-${lecturer.id}`}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {lecturer.departmentName || lecturer.departmentCode || "Chua co khoa"}
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Dang dung</Badge>
                </div>

                <div className="mb-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{lecturer.email || "Chua cap nhat email"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{lecturer.phone || "Chua cap nhat dien thoai"}</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm text-gray-600">Ma giang vien</span>
                    <span className="font-mono text-sm font-semibold text-gray-900">
                      {lecturer.staffCode || "-"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" disabled>Sua</Button>
                    <Button variant="outline" size="sm" className="flex-1" disabled>Lich day</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export { LecturersPage };
