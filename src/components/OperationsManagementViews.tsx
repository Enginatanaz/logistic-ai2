import React, { useState } from 'react';
import {
  AlertTriangle,
  BookmarkCheck,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  History,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import {
  DirectRouteConnection,
  DistanceMatrix,
  Facility,
  FacilityRelationship,
  ForbiddenRouteRule,
  MatrixData,
  OptimizationParameters,
  PlanningExecutionResult,
  RuleVerificationCase,
  SpecialDistanceLocation,
  VehicleTypeConfig,
} from '../types/logistics';
import { calculateDaysFromDistanceKm } from '../engines/distanceCalculationEngine';
import { getStandardMatrixFacilities } from '../engines/shipmentCalculationEngine';

/* ============================================================================
 * EKRAN 5: TESİS YÖNETİMİ
 * ========================================================================== */
interface FacilityManagementProps {
  facilities: Facility[];
  onAddFacility: (name: string, city: string, isCrossDockOnly: boolean) => void;
  onUpdateFacility: (updated: Facility) => void;
}

export const FacilityManagementView: React.FC<FacilityManagementProps> = ({
  facilities,
  onAddFacility,
  onUpdateFacility,
}) => {
  const [newName, setNewName] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newIsCdOnly, setNewIsCdOnly] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNameVal, setEditingNameVal] = useState<string>('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newName.trim().toUpperCase();
    if (!cleaned) return;
    onAddFacility(
      cleaned.endsWith('TM') ? cleaned : `${cleaned} TM`,
      newCity.trim() || cleaned,
      newIsCdOnly
    );
    setNewName('');
    setNewCity('');
    setNewIsCdOnly(false);
  };

  return (
    <div className="space-y-6">
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Tesis Yönetimi · 19 Standart Transfer Merkezi + Gebze TM Özel Cross Dock
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
            Tesis Tanımları, Aktiflik Durumu ve Özel Operasyon Kısıtları
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Gebze TM özel Cross Dock statüsündedir; normal 19 çıkış/varış tesisi matrisine karıştırılmaz. Yeni tesis ekleyebilir veya tesis kısıtlarını yönetebilirsiniz.
          </p>
        </div>

        <form onSubmit={handleCreate} className="flex flex-wrap items-center gap-2 shrink-0">
          <input
            type="text"
            placeholder="Yeni Tesis Adı (Örn: DENİZLİ TM)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
          />
          <input
            type="text"
            placeholder="Şehir"
            value={newCity}
            onChange={(e) => setNewCity(e.target.value)}
            className="w-32 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
          />
          <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 px-2">
            <input
              type="checkbox"
              checked={newIsCdOnly}
              onChange={(e) => setNewIsCdOnly(e.target.checked)}
            />
            <span>Özel Cross Dock</span>
          </label>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tesis Ekle</span>
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-3.5">#</th>
                <th className="py-3 px-3.5">Tesis Kodu</th>
                <th className="py-3 px-3.5">Tesis Adı</th>
                <th className="py-3 px-3.5">Şehir</th>
                <th className="py-3 px-3.5">Tesis Statüsü / Rolü</th>
                <th className="py-3 px-3.5">Varış Kamyon Zorunluluğu</th>
                <th className="py-3 px-3.5">Çıkış TIR Kotası</th>
                <th className="py-3 px-3.5">Gebze CD Uygunluğu</th>
                <th className="py-3 px-3.5 text-right">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {facilities.map((f, index) => (
                <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3.5 font-mono text-slate-500">{index + 1}</td>
                  <td className="py-2.5 px-3.5 font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {f.code}
                  </td>
                  <td className="py-2.5 px-3.5 font-bold text-slate-900 dark:text-slate-100">
                    {editingId === f.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={editingNameVal}
                          onChange={(e) => setEditingNameVal(e.target.value)}
                          className="px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-blue-500 rounded"
                        />
                        <button
                          onClick={() => {
                            if (editingNameVal.trim()) {
                              onUpdateFacility({ ...f, name: editingNameVal.trim().toUpperCase() });
                            }
                            setEditingId(null);
                          }}
                          className="px-2 py-1 text-[11px] bg-blue-600 text-white rounded cursor-pointer"
                        >
                          Kaydet
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>{f.name}</span>
                        <button
                          onClick={() => {
                            setEditingId(f.id);
                            setEditingNameVal(f.name);
                          }}
                          className="text-[11px] font-normal text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          Düzenle
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-400">{f.city}</td>
                  <td className="py-2.5 px-3.5">
                    {f.isCrossDockOnly ? (
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        Özel Cross Dock (Matris Dışı Aktarma)
                      </span>
                    ) : f.role === 'MAIN_CROSS_DOCK' ? (
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        Ana Transfer + Ana Cross Dock Merkezi
                      </span>
                    ) : (
                      <span className="text-slate-700 dark:text-slate-300">
                        Standart Transfer Merkezi (Çıkış/Varış)
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3.5">
                    {!f.isCrossDockOnly && (
                      <label className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(f.inboundKamyonOnly)}
                          onChange={(e) =>
                            onUpdateFacility({ ...f, inboundKamyonOnly: e.target.checked })
                          }
                        />
                        <span
                          className={
                            f.inboundKamyonOnly
                              ? 'font-semibold text-amber-600 dark:text-amber-400'
                              : 'text-slate-500'
                          }
                        >
                          {f.inboundKamyonOnly ? 'Yalnızca Kamyon (TIR Yasak)' : 'TIR + Kamyon'}
                        </span>
                      </label>
                    )}
                  </td>
                  <td className="py-2.5 px-3.5 font-mono tabular-nums">
                    {f.id === 'ANKARA TM'
                      ? 'Max 6 TIR'
                      : f.id === 'MARMARA TM'
                      ? 'Max 1 TIR'
                      : 'Sınırsız'}
                  </td>
                  <td className="py-2.5 px-3.5">
                    {!f.isCrossDockOnly && (
                      <label className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(f.eligibleForGebzeCrossDock)}
                          onChange={(e) =>
                            onUpdateFacility({
                              ...f,
                              eligibleForGebzeCrossDock: e.target.checked,
                            })
                          }
                        />
                        <span className="text-slate-600 dark:text-slate-400">
                          {f.eligibleForGebzeCrossDock ? 'Gebze CD Adayı' : 'Standart'}
                        </span>
                      </label>
                    )}
                  </td>
                  <td className="py-2.5 px-3.5 text-right">
                    <button
                      onClick={() => onUpdateFacility({ ...f, isActive: !f.isActive })}
                      className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
                        f.isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {f.isActive ? 'Aktif' : 'Pasif'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * EKRAN 6: ARAÇ YÖNETİMİ
 * ========================================================================== */
interface VehicleManagementProps {
  vehicles: VehicleTypeConfig[];
  optParams: OptimizationParameters;
  onUpdateVehiclesAndParams: (
    vehicles: VehicleTypeConfig[],
    optParams: OptimizationParameters
  ) => void;
}

export const VehicleManagementView: React.FC<VehicleManagementProps> = ({
  vehicles,
  optParams,
  onUpdateVehiclesAndParams,
}) => {
  const [panelvanCap, setPanelvanCap] = useState(String(optParams.panelvanCapacityDesi || 3500));
  const [kamyonCap, setKamyonCap] = useState(String(optParams.kamyonCapacityDesi));
  const [splitThresh, setSplitThresh] = useState(String(optParams.splitUpperThresholdDesi));
  const [tirCap, setTirCap] = useState(String(optParams.tirCapacityDesi));
  const [minDirect, setMinDirect] = useState(String(optParams.directKamyonMinDesi));

  const applyChanges = () => {
    const pCap = Math.max(500, Number(panelvanCap) || 3500);
    const kCap = Math.max(1000, Number(kamyonCap) || 12500);
    const sThr = Math.max(kCap, Number(splitThresh) || 16000);
    const tCap = Math.max(sThr + 1, Number(tirCap) || 22500);
    const mDir = Math.max(500, Number(minDirect) || 7500);

    const updatedVehicles = vehicles.map((v) => {
      if (v.id === 'PANELVAN') return { ...v, capacityDesi: pCap };
      if (v.id === 'KAMYON') return { ...v, capacityDesi: kCap };
      return { ...v, capacityDesi: tCap };
    });

    onUpdateVehiclesAndParams(updatedVehicles, {
      ...optParams,
      panelvanCapacityDesi: pCap,
      kamyonCapacityDesi: kCap,
      splitUpperThresholdDesi: sThr,
      tirCapacityDesi: tCap,
      directKamyonMinDesi: mDir,
    });
  };

  const resetDefaults = () => {
    setPanelvanCap('3500');
    setKamyonCap('12500');
    setSplitThresh('16000');
    setTirCap('22500');
    setMinDirect('7500');
    const updatedVehicles = vehicles.map((v) => {
      if (v.id === 'PANELVAN') return { ...v, capacityDesi: 3500 };
      if (v.id === 'KAMYON') return { ...v, capacityDesi: 12500 };
      return { ...v, capacityDesi: 22500 };
    });
    onUpdateVehiclesAndParams(updatedVehicles, {
      ...optParams,
      panelvanCapacityDesi: 3500,
      kamyonCapacityDesi: 12500,
      splitUpperThresholdDesi: 16000,
      tirCapacityDesi: 22500,
      directKamyonMinDesi: 7500,
    });
  };

  return (
    <div className="space-y-6">
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Araç Yönetimi · Kapasite ve Eşik Motoru
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
            Araç Türleri, Desi Kapasiteleri ve Seçim Eşikleri
          </h1>
        </div>
        <button
          onClick={resetDefaults}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Standart Kapasitelere Dön (3.500 / 12.500 / 16.000 / 22.500)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Araç Kapasite ve Karar Eşikleri
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Panelvan Maksimum Kapasitesi (Standart: 3.500 desi)
              </label>
              <input
                type="number"
                value={panelvanCap}
                onChange={(e) => setPanelvanCap(e.target.value)}
                className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kamyon Maksimum Kapasitesi (Standart: 12.500 desi)
              </label>
              <input
                type="number"
                value={kamyonCap}
                onChange={(e) => setKamyonCap(e.target.value)}
                className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                1 Kamyon + Cross Dock Üst Eşiği (Standart: 16.000 desi — 16.000 TIR’a dahil değildir)
              </label>
              <input
                type="number"
                value={splitThresh}
                onChange={(e) => setSplitThresh(e.target.value)}
                className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                TIR Maksimum Kapasitesi (Standart: 22.500 desi)
              </label>
              <input
                type="number"
                value={tirCap}
                onChange={(e) => setTirCap(e.target.value)}
                className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Direkt Kamyon Öncelik Alt Eşiği (Standart: 7.500 desi)
              </label>
              <input
                type="number"
                value={minDirect}
                onChange={(e) => setMinDirect(e.target.value)}
                className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
              />
            </div>

            <button
              onClick={applyChanges}
              className="w-full py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
            >
              Araç Kapasite ve Eşiklerini Güncelle
            </button>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Deterministik Araç Seçim Algoritması Özeti
          </h2>
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
              <div className="font-bold text-slate-900 dark:text-slate-100">
                1. 0 – 12.500 Desi Aralığı
              </div>
              <p className="mt-1">
                Gönderi direkt taşıma eşiğini ({optParams.directKamyonMinDesi.toLocaleString('tr-TR')} desi) karşılıyorsa, mevcut hat planında yer alıyorsa veya Konya→Afyon/Ankara ya da Adana/Diyarbakır→Gaziantep hattındaysa doğrudan 1 adet Kamyon planlanır.
              </p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
              <div className="font-bold text-slate-900 dark:text-slate-100">
                2. 12.500 – 16.000 Desi Aralığı (16.000 Dahil)
              </div>
              <p className="mt-1">
                1 adet tam dolu Kamyon (12.500 desi) oluşturulur. Kalan (0 – 3.500 desi) doğrudan ikinci bir kamyona veya TIR’a dönüştürülmez; Ankara veya Gebze Cross Dock üzerinden aynı varışlı diğer tesis yükleriyle birleştirilir.
              </p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
              <div className="font-bold text-slate-900 dark:text-slate-100">
                3. 16.000 Desi Üzeri (16.001+ Desi)
              </div>
              <p className="mt-1">
                Varış tesisi Bursa veya İzmir değilse ve çıkış tesisinin TIR kotası uygunsa 22.500 desi kapasiteli TIR planlanır. 22.500 desiyi aşan miktar için aynı algoritma tekrar işletilir.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * EKRAN 7: KATSAYI, KURALLAR VE BÖLÜM 16 OTOMATİK DOĞRULAMA TEST SİSTEMİ
 * ========================================================================== */
interface RulesAndCoefficientsProps {
  facilities: Facility[];
  optParams: OptimizationParameters;
  forbiddenRules: ForbiddenRouteRule[];
  packageShareMatrix: MatrixData;
  desiPerPackageMatrix: MatrixData;
  verificationCases: RuleVerificationCase[];
  onUpdateOptParams: (updated: OptimizationParameters) => void;
  onToggleForbiddenRule: (ruleId: string) => void;
}

export const RulesAndCoefficientsView: React.FC<RulesAndCoefficientsProps> = ({
  facilities,
  optParams,
  forbiddenRules,
  packageShareMatrix,
  desiPerPackageMatrix,
  verificationCases,
  onUpdateOptParams,
  onToggleForbiddenRule,
}) => {
  const [subTab, setSubTab] = useState<'TESTS' | 'RULES' | 'COEFFICIENTS'>('TESTS');
  const activeFacilities = getStandardMatrixFacilities(facilities);
  const passedCount = verificationCases.filter((c) => c.passed).length;

  return (
    <div className="space-y-6">
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Katsayılar, Operasyon Kuralları ve Doğrulama Motoru
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
            Dağıtım Katsayıları, Tesis Kısıtları ve 13 Otomatik Hesaplama Testi
          </h1>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
          <button
            onClick={() => setSubTab('TESTS')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              subTab === 'TESTS'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Bölüm 16 Doğrulama Testleri ({passedCount}/{verificationCases.length})
          </button>
          <button
            onClick={() => setSubTab('RULES')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              subTab === 'RULES'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Operasyon Kuralları & Yasaklı Hatlar
          </button>
          <button
            onClick={() => setSubTab('COEFFICIENTS')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              subTab === 'COEFFICIENTS'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Excel Dağıtım Katsayıları (19×19)
          </button>
        </div>
      </div>

      {subTab === 'TESTS' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Bölüm 16: Deterministik Hesaplama Doğrulama ve Kural Test Sistemi
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Uygulama hesaplama motorunun referans Excel kurallarıyla %100 uyumu aşağıda gerçek zamanlı test edilmektedir.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>{passedCount} / {verificationCases.length} TEST BAŞARILI</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Kod</th>
                  <th className="py-2.5 px-3">Test Senaryosu</th>
                  <th className="py-2.5 px-3">Girdi Verisi</th>
                  <th className="py-2.5 px-3">Beklenen Kural Sonucu</th>
                  <th className="py-2.5 px-3">Motorun Ürettiği Sonuç</th>
                  <th className="py-2.5 px-3 text-right">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {verificationCases.map((tc) => (
                  <tr key={tc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-500">
                      {tc.id}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {tc.title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {tc.scenarioDescription}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">
                      {tc.inputSummary}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                      {tc.expectedOutcome}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {tc.actualOutcome}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {tc.passed ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Doğrulandı</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-red-600 dark:text-red-400">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Hata</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'RULES' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Tesis Bazlı Özel Kısıtlar ve Parametreler
            </h2>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Ankara TM Çıkışlı Maksimum TIR Sayısı
                </span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={optParams.ankaraMaxOutboundTir}
                  onChange={(e) =>
                    onUpdateOptParams({
                      ...optParams,
                      ankaraMaxOutboundTir: Math.max(1, Number(e.target.value) || 6),
                    })
                  }
                  className="w-20 px-2.5 py-1 text-right font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded"
                />
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Marmara TM Çıkışlı Maksimum TIR Sayısı
                </span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={optParams.marmaraMaxOutboundTir}
                  onChange={(e) =>
                    onUpdateOptParams({
                      ...optParams,
                      marmaraMaxOutboundTir: Math.max(1, Number(e.target.value) || 1),
                    })
                  }
                  className="w-20 px-2.5 py-1 text-right font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded"
                />
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Ankara Cross Dock Varış Başına Max Kamyon / TIR
                </span>
                <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                  {optParams.ankaraCrossDockMaxKamyonPerDest} Kamyon +{' '}
                  {optParams.ankaraCrossDockMaxTirPerDest} TIR
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Mevcut Hat Çıkış Planını Koru
                </span>
                <input
                  type="checkbox"
                  checked={optParams.preserveBaselinePlan}
                  onChange={(e) =>
                    onUpdateOptParams({
                      ...optParams,
                      preserveBaselinePlan: e.target.checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Tesis İçi (Köşegen) Dağılımları Hat Tablosuna Dahil Et
                </span>
                <input
                  type="checkbox"
                  checked={optParams.includeSelfRoutesInLinehaul}
                  onChange={(e) =>
                    onUpdateOptParams({
                      ...optParams,
                      includeSelfRoutesInLinehaul: e.target.checked,
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Bölüm 9: Yasaklı Güzergâhlar ve Gönderi Koruma Kuralları
            </h2>
            <div className="space-y-3 text-xs">
              {forbiddenRules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100">
                      {rule.originId} → {rule.destinationId} (Yasaklı Aktarma: {rule.forbiddenViaId})
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                      {rule.description}
                    </p>
                  </div>
                  <button
                    onClick={() => onToggleForbiddenRule(rule.id)}
                    className={`px-2.5 py-1 font-semibold rounded shrink-0 cursor-pointer ${
                      rule.isActive
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {rule.isActive ? 'Aktif' : 'Pasif'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {subTab === 'COEFFICIENTS' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Hücre Bazlı Desi/Paket Katsayısı ve Paket Dağılım Payı Matrisi
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Referans Excel’deki gerçek Paket ve Desi matrislerinden çıkarılan hücre bazlı Desi/Paket oranı ve binde pay katsayıları
            </p>
          </div>
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2 px-3">Çıkış \ Varış (Desi/Paket Oranı)</th>
                  {activeFacilities.map((f) => (
                    <th key={f.id} className="py-2 px-2 text-right whitespace-nowrap">
                      {f.name.replace(' TM', '')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono tabular-nums">
                {activeFacilities.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-1.5 px-3 font-sans font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {o.name}
                    </td>
                    {activeFacilities.map((d) => {
                      const ratio = desiPerPackageMatrix[o.id]?.[d.id] ?? 4;
                      const sharePermille = ((packageShareMatrix[o.id]?.[d.id] ?? 0) * 1000).toFixed(2);
                      return (
                        <td key={d.id} className="py-1.5 px-2 text-right">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {ratio.toFixed(2)}
                          </div>
                          <div className="text-[10px] text-slate-400">‰{sharePermille}</div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
 * EKRAN 7: MESAFE YÖNETİMİ (KGM STANDART MESAFELERİ & ÖZEL LOKASYONLAR)
 * ========================================================================== */
interface DistanceManagementProps {
  facilities: Facility[];
  distanceMatrix: DistanceMatrix;
  specialLocations?: SpecialDistanceLocation[];
  onUpdateDistance: (originId: string, destId: string, km: number | null) => void;
  onResetDistances: () => void;
}

export const DistanceManagementView: React.FC<DistanceManagementProps> = ({
  facilities,
  distanceMatrix,
  specialLocations = [],
  onUpdateDistance,
  onResetDistances,
}) => {
  const activeFacilities = facilities.filter((f) => f.isActive && !f.isCrossDockOnly);

  return (
    <div className="space-y-6">
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Mesafe ve Teslimat Süresi Motoru · 0–600 km: 1 Gün · 600–1.000 km: 2 Gün · 1.000+ km: 3 Gün
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
            Tesisler Arası Karayolu Mesafe Matrisi (km)
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Bir hücreyi boş bıraktığınızda, sistem mesafe uydurmaz ve ilgili hatta otomatik olarak <strong>“Mesafe Eksik Uyarısı”</strong> gösterir.
          </p>
        </div>

        <button
          onClick={onResetDistances}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg shrink-0 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>KGM Standart Mesafelerine Döndür</span>
        </button>
      </div>

      {/* Main 19x19 Distance Matrix */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-slate-700">
              <tr>
                <th className="sticky left-0 z-30 bg-slate-200 dark:bg-slate-800 py-2.5 px-3 min-w-[140px]">
                  Çıkış \ Varış (km)
                </th>
                {activeFacilities.map((d) => (
                  <th key={d.id} className="py-2 px-2 text-right whitespace-nowrap min-w-[88px]">
                    {d.name.replace(' TM', '')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {activeFacilities.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="sticky left-0 z-10 bg-slate-50 dark:bg-slate-900 py-1.5 px-3 font-bold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">
                    {o.name}
                  </td>
                  {activeFacilities.map((d) => {
                    const km = distanceMatrix[o.id]?.[d.id] ?? null;
                    const days = calculateDaysFromDistanceKm(km);
                    return (
                      <td
                        key={d.id}
                        className={`p-1 border-r border-slate-100 dark:border-slate-800 ${
                          km === null ? 'bg-red-50 dark:bg-red-950/30' : ''
                        }`}
                      >
                        <input
                          type="number"
                          placeholder="EKSİK"
                          value={km === null ? '' : km}
                          onChange={(e) => {
                            const raw = e.target.value.trim();
                            if (raw === '') {
                              onUpdateDistance(o.id, d.id, null);
                            } else {
                              const parsed = Math.max(0, Math.round(Number(raw)));
                              onUpdateDistance(o.id, d.id, Number.isNaN(parsed) ? null : parsed);
                            }
                          }}
                          className="w-full text-right font-mono tabular-nums px-1 py-0.5 bg-transparent focus:bg-white dark:focus:bg-slate-800 rounded text-slate-900 dark:text-slate-100"
                        />
                        <div className="text-[10px] text-right font-mono text-slate-400 px-1">
                          {days === null ? (
                            <span className="text-red-600 font-semibold">Eksik!</span>
                          ) : (
                            `${days}g`
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 8: Special Distance Locations (Özel Lokasyonlar) */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Bölüm 8: Özel Lokasyon Mesafeleri (Standart Tesislerle Birleştirilmeyen Özel Noktalar)
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
            Özel Dağıtım Merkezleri ve Koridor Mesafeleri
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Bu özel noktalar standart 19 transfer merkezine zorla dahil edilmeyip ayrı kayıt altında tutulur.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {specialLocations.map((loc) => (
            <div
              key={loc.id}
              className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                  {loc.name}
                </span>
                <span className="text-[10px] px-2 py-0.5 font-semibold rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                  {loc.category}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                {loc.notes}
              </p>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700/60 text-xs font-mono">
                {loc.distances.map((dist, i) => (
                  <div key={i} className="py-1 flex items-center justify-between">
                    <span className="text-slate-700 dark:text-slate-300 font-sans">
                      → {dist.destination}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {dist.km} km ({calculateDaysFromDistanceKm(dist.km)} Gün)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * EKRAN 6: DİREKT HAT YÖNETİMİ (BÖLÜM 4: 15 TEK YÖNLÜ DİREKT HAT LİSTESİ)
 * ========================================================================== */
interface DirectRouteManagementProps {
  facilities: Facility[];
  directRoutes: DirectRouteConnection[];
  onToggleDirectRoute: (routeId: string) => void;
  onAddDirectRoute: (originId: string, destId: string, notes?: string) => void;
  onResetDirectRoutes: () => void;
}

export const DirectRouteManagementView: React.FC<DirectRouteManagementProps> = ({
  facilities,
  directRoutes,
  onToggleDirectRoute,
  onAddDirectRoute,
  onResetDirectRoutes,
}) => {
  const [selectedOrigin, setSelectedOrigin] = useState<string>('ALL');
  const [newOrigin, setNewOrigin] = useState<string>('ANKARA TM');
  const [newDest, setNewDest] = useState<string>('İZMİR TM');
  const [newNotes, setNewNotes] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  const activeFacilities = facilities.filter((f) => f.isActive && !f.isCrossDockOnly);

  const filteredRoutes = directRoutes.filter((r) => {
    if (selectedOrigin !== 'ALL' && r.originId !== selectedOrigin) return false;
    if (search.trim()) {
      const q = search.trim().toUpperCase();
      const matchO = r.originId.toUpperCase().includes(q);
      const matchD = r.destinationId.toUpperCase().includes(q);
      if (!matchO && !matchD) return false;
    }
    return true;
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newOrigin === newDest) return;
    onAddDirectRoute(newOrigin, newDest, newNotes.trim() || undefined);
    setNewNotes('');
  };

  return (
    <div className="space-y-6">
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Direkt Hat Yönetimi · Bölüm 4: 15 Tek Yönlü Direkt Hat Listesi
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
            Gerçek Direkt Hat Bağlantıları ve Yön Yönetimi
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            <strong>Kural:</strong> İki tesis arasında karayolu mesafesi olması o hatta direkt araç kalkacağı anlamına gelmez. Yalnızca bu listede aktif olan direkt hatlarda direkt sefer planlanır; diğerleri aktarma merkezleri veya bağlı hub üzerinden taşınır.
          </p>
        </div>

        <button
          onClick={onResetDirectRoutes}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg shrink-0 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Bölüm 4 Standart 15 Direkt Hat Listesine Sıfırla</span>
        </button>
      </div>

      {/* Add Direct Line Form & Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form
          onSubmit={handleAdd}
          className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4"
        >
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Yeni Direkt Hat Tanımla
          </h2>
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Çıkış Tesisi
              </label>
              <select
                value={newOrigin}
                onChange={(e) => setNewOrigin(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
              >
                {activeFacilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Varış Tesisi (Tek Yönlü)
              </label>
              <select
                value={newDest}
                onChange={(e) => setNewDest(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
              >
                {activeFacilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Operasyonel Açıklama / Not
              </label>
              <input
                type="text"
                placeholder="Örn: Sezonluk ekspres direkt hat"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
            >
              Direkt Hattı Ekle ve Aktifleştir
            </button>
          </div>
        </form>

        <div className="lg:col-span-2 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Tanımlı Direkt Hatlar ({filteredRoutes.length} Hat)
            </h2>
            <div className="flex items-center gap-2">
              <select
                value={selectedOrigin}
                onChange={(e) => setSelectedOrigin(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
              >
                <option value="ALL">Tüm Çıkış Tesisleri</option>
                {activeFacilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} Çıkışlı Hatlar
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Filtrele..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-32 px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-[500px] divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {filteredRoutes.map((route) => (
              <div
                key={route.id}
                className="py-2.5 flex items-start justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded"
              >
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
                    <span>{route.originId}</span>
                    <span className="text-slate-400">→</span>
                    <span className="text-blue-600 dark:text-blue-400">{route.destinationId}</span>

                    {/* Operational Vehicle Badge */}
                    {route.operationalVehicleType === 'TANIMSIZ' ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                        Eksik Araç Tanımı (!)
                      </span>
                    ) : route.operationalVehicleType === 'PANELVAN' ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
                        Panelvan ({route.capacityDesi?.toLocaleString('tr-TR')} d)
                      </span>
                    ) : route.operationalVehicleType === 'TIR' ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300">
                        TIR ({route.capacityDesi?.toLocaleString('tr-TR')} d)
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300">
                        Kamyon ({route.capacityDesi?.toLocaleString('tr-TR')} d)
                      </span>
                    )}

                    {/* Route Quota Badge */}
                    {route.routeQuotaType === 'ANTALYA_OZEL_TIR' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-300">
                        Antalya Özel TIR
                      </span>
                    )}

                    {/* Verification Required Badge */}
                    {route.requiresVerification && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300">
                        Doğrulanmalı
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-500">
                    {route.notes || (route.isUserOverridden ? 'Kullanıcı tanımlı direkt hat' : 'Bölüm 4 standart direkt bağlantı')}
                  </div>

                  {route.warningMessage && (
                    <div className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                      ⚠ {route.warningMessage}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-0.5">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                      route.isActive
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {route.isActive ? 'Aktif Direkt' : 'Pasif'}
                  </span>
                  <button
                    onClick={() => onToggleDirectRoute(route.id)}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded cursor-pointer"
                  >
                    {route.isActive ? 'Pasife Al' : 'Aktifleştir'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * EKRAN 10: OPERASYONEL BAĞLILIKLAR (BÖLÜM 1 & 10: VAN, MERZİFON, TRABZON, ANTALYA)
 * ========================================================================== */
interface FacilityRelationshipsProps {
  facilities: Facility[];
  relationships: FacilityRelationship[];
  onToggleOriginActive: (facilityId: string) => void;
}

export const FacilityRelationshipsView: React.FC<FacilityRelationshipsProps> = ({
  facilities,
  relationships,
  onToggleOriginActive,
}) => {
  return (
    <div className="space-y-6">
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Operasyonel Bağlılıklar · Bölüm 1 & Bölüm 10: Pasif ve Bağlı Tesis Davranışı
        </div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
          Bağlı Tesisler, Ana Hub İlişkileri ve Özel Besleyici Güzergâhlar
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
          <strong>Temel Prensip:</strong> Bir tesisin başka bir tesise bağlı çalışması, iki tesisin aynı kabul edilmesi demek değildir. Paketlerin gerçek kaynak ve varış tesisleri manifestoda daima korunur.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {relationships.map((rel) => (
          <div
            key={rel.facilityId}
            className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-mono text-slate-500">Bağlı Tesis</span>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {rel.facilityName}
                </h2>
              </div>
              <span
                className={`px-2.5 py-1 text-xs font-semibold rounded ${
                  rel.isOriginActive
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                }`}
              >
                {rel.isOriginActive ? 'Doğrudan Çıkış Açık' : 'Hub Üzerinden Sevk'}
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-lg">
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Ana Bağlı Hub:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{rel.parentFacilityName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Alternatif Aktarma Merkezi:</span>
                <span className="font-mono">{rel.alternativeCrossDockId}</span>
              </div>
              <p className="pt-1 leading-relaxed">
                {rel.description}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                {rel.isOriginActive ? 'Bu tesisten direkt araç planlamasına izin verilir' : 'Tüm yükler önce bağlı hub havuzuna aktarılır'}
              </span>
              <button
                onClick={() => onToggleOriginActive(rel.facilityId)}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-lg cursor-pointer"
              >
                {rel.isOriginActive ? 'Hub Bağlılığına Döndür' : 'Doğrudan Çıkışı Aktifleştir'}
              </button>
            </div>
          </div>
        ))}

        {/* Antalya TM Feeder Special Behavior Card */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-mono text-slate-500">Özel Besleyici Güzergâh (Bölüm 4.16)</span>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                ANTALYA TM
              </h2>
            </div>
            <span className="px-2.5 py-1 text-xs font-semibold rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
              Afyon TM Besleme Aktif
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-lg">
            <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Zorunlu Besleme Hattı:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">AFYON TM</span>
            </div>
            <p className="pt-1 leading-relaxed">
              Bölüm 4.16 kuralı uyarınca Antalya TM’den uzun hat doğrudan araç kaldırılmaz. Antalya TM çıkışlı tüm gönderiler Afyon TM aktarma havuzuna bağlanır; Afyon TM üzerinden ana hat araçlarıyla gerçek varış merkezine sevk edilir. Gerçek paket kaynağı "ANTALYA TM" olarak muhafaza edilir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};


/* ============================================================================
 * EKRAN 9: PLANLAMA GEÇMİŞİ
 * ========================================================================== */
interface PlanningHistoryProps {
  currentResult: PlanningExecutionResult;
  history: PlanningExecutionResult[];
  onSaveCurrentToHistory: (name: string) => void;
  onDeleteHistoryItem: (planId: string) => void;
}

export const PlanningHistoryView: React.FC<PlanningHistoryProps> = ({
  currentResult,
  history,
  onSaveCurrentToHistory,
  onDeleteHistoryItem,
}) => {
  const [planTitle, setPlanTitle] = useState('');
  const [selectedCompareId, setSelectedCompareId] = useState<string | null>(
    history[0]?.planId ?? null
  );

  const comparedPlan =
    history.find((h) => h.planId === selectedCompareId) ?? history[0] ?? null;

  return (
    <div className="space-y-6">
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Planlama Geçmişi · Kalıcı Veri Katmanı (IndexedDB)
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
            Kaydedilen Hat Planları ve Senaryo Karşılaştırma
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <input
            type="text"
            placeholder="Senaryo Adı (Örn: Kasım 1. Hafta Onaylı Plan)"
            value={planTitle}
            onChange={(e) => setPlanTitle(e.target.value)}
            className="w-64 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
          />
          <button
            onClick={() => {
              onSaveCurrentToHistory(
                planTitle.trim() || `${currentResult.planName} (${new Date().toLocaleTimeString('tr-TR')})`
              );
              setPlanTitle('');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
          >
            <BookmarkCheck className="w-3.5 h-3.5" />
            <span>Mevcut Planı Geçmişe Kaydet</span>
          </button>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="p-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center space-y-3">
          <History className="w-8 h-8 text-slate-400 mx-auto" />
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Henüz kaydedilmiş geçmiş plan bulunmuyor
          </div>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Yukarıdaki “Mevcut Planı Geçmişe Kaydet” butonuna tıklayarak aktif hat planını kaydedebilir ve farklı senaryolarla karşılaştırabilirsiniz.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Kaydedilen Planlar ({history.length})
            </h2>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {history.map((item) => (
                <div
                  key={item.planId}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100">
                      {item.planName}
                    </div>
                    <div className="text-slate-500 font-mono mt-0.5">
                      {new Date(item.createdAt).toLocaleString('tr-TR')} · {item.summary.totalVehicles} Araç ({item.summary.totalTir} TIR, {item.summary.totalKamyon} Kamyon) · %{item.summary.averageFillRate} Doluluk
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setSelectedCompareId(item.planId)}
                      className={`px-2.5 py-1 rounded font-semibold cursor-pointer ${
                        comparedPlan?.planId === item.planId
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      Karşılaştır
                    </button>
                    <button
                      onClick={() => onDeleteHistoryItem(item.planId)}
                      className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {comparedPlan && (
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Aktif Plan vs Seçilen Geçmiş Plan Karşılaştırması
              </h2>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500">
                    <th className="py-2 text-left">Kriter</th>
                    <th className="py-2 text-right">Aktif Plan</th>
                    <th className="py-2 text-right">{comparedPlan.planName}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono tabular-nums">
                  <tr>
                    <td className="py-2 font-sans text-slate-600 dark:text-slate-400">Toplam Desi</td>
                    <td className="py-2 text-right font-bold">{currentResult.summary.totalInputDesi.toLocaleString('tr-TR')}</td>
                    <td className="py-2 text-right">{comparedPlan.summary.totalInputDesi.toLocaleString('tr-TR')}</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-sans text-slate-600 dark:text-slate-400">Toplam Araç</td>
                    <td className="py-2 text-right font-bold">{currentResult.summary.totalVehicles}</td>
                    <td className="py-2 text-right">{comparedPlan.summary.totalVehicles}</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-sans text-slate-600 dark:text-slate-400">Toplam TIR / Kamyon</td>
                    <td className="py-2 text-right font-bold">
                      {currentResult.summary.totalTir} / {currentResult.summary.totalKamyon}
                    </td>
                    <td className="py-2 text-right">
                      {comparedPlan.summary.totalTir} / {comparedPlan.summary.totalKamyon}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 font-sans text-slate-600 dark:text-slate-400">Ortalama Doluluk</td>
                    <td className="py-2 text-right font-bold text-emerald-600">
                      %{currentResult.summary.averageFillRate}
                    </td>
                    <td className="py-2 text-right">%{comparedPlan.summary.averageFillRate}</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-sans text-slate-600 dark:text-slate-400">Cross Dock Desi</td>
                    <td className="py-2 text-right font-bold">
                      {currentResult.summary.plannedCrossDockDesi.toLocaleString('tr-TR')}
                    </td>
                    <td className="py-2 text-right">
                      {comparedPlan.summary.plannedCrossDockDesi.toLocaleString('tr-TR')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ============================================================================
 * EKRAN 10: RAPORLAMA VE EXCEL DIŞA AKTARMA MERKEZİ
 * ========================================================================== */
interface ReportingViewProps {
  result: PlanningExecutionResult;
  onExportExcel: () => void;
}

export const ReportingView: React.FC<ReportingViewProps> = ({
  result,
  onExportExcel,
}) => {
  const reportSheets = [
    {
      no: '01',
      name: 'Hat Planlama',
      desc: 'Tüm çıkış tesisleri, hat kodları, yüklenen tesisler, varış noktası, desi, kapasite ve doluluk oranlarını içeren ana operasyon tablosu.',
      count: `${result.lines.length} Araç Hattı`,
    },
    {
      no: '02',
      name: 'Araç Listesi',
      desc: 'TIR (22.500 desi) ve Kamyon (12.500 desi) bazında araç manifestosu, boş kapasite ve kalkış saatleri.',
      count: `${result.summary.totalTir} TIR · ${result.summary.totalKamyon} Kamyon`,
    },
    {
      no: '03',
      name: 'Tesis Bazlı Yükleme',
      desc: '19 standart transfer merkezi + Gebze Cross Dock için toplam çıkan ve varışlı araç/desi icmali.',
      count: '20 Tesis İcmali',
    },
    {
      no: '04',
      name: 'Desi Hesapları',
      desc: 'Üç Hacim Ortak Katsayı Modeli ile hesaplanan 19×19 Desi Dağılım Matrisi ve Paket Dağılım Matrisi.',
      count: `${result.summary.totalInputDesi.toLocaleString('tr-TR')} Desi`,
    },
    {
      no: '05',
      name: 'Araç Doluluk Oranları',
      desc: 'Doluluk oranına göre sıralı araç verimlilik analizi (%85+ Yüksek Verimli, %65-85 Normal, <%65 Zorunlu Direkt).',
      count: `Ort. %${result.summary.averageFillRate} Doluluk`,
    },
    {
      no: '06',
      name: 'Cross Dock Planı',
      desc: 'Ankara Cross Dock ve Gebze Cross Dock üzerinden birleştirilen her gönderinin kaynak, gerçek varış ve birleştirme nedeni.',
      count: `${result.crossDockMovements.length} Aktarma Kaydı`,
    },
    {
      no: '07',
      name: 'Planlanamayan Gönderiler',
      desc: 'Ankara Cross Dock varış başına 1 Kamyon + 1 TIR sınırı veya 6 TIR kotası nedeniyle bekleyen gönderiler.',
      count: `${result.unplannedShipments.length} Bekleyen Kayıt`,
    },
    {
      no: '08',
      name: 'Mesafe ve Teslimat',
      desc: 'Tesisler arası karayolu mesafeleri (km) ve 1-2-3 gün tahmini teslimat süresi matrisi.',
      count: `Ort. ${result.summary.estimatedAvgDeliveryDays} Gün`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Raporlama ve Dışa Aktarma Merkezi · 8 Sayfalı Kurumsal Excel Çıktısı
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
            Operasyonel Excel Raporu (.xlsx)
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Uygulamanın kendi bağımsız motorunda ürettiği tüm hat planlama, Cross Dock ve desi tablolarını tek bir çok sayfalı Excel çalışma kitabı olarak indirebilirsiniz.
          </p>
        </div>

        <button
          onClick={onExportExcel}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shrink-0 cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>8 Sayfalı Excel Raporunu İndir (.xlsx)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportSheets.map((sh) => (
          <div
            key={sh.no}
            className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>SAYFA {sh.no}</span>
                <span className="text-blue-600 dark:text-blue-400 font-semibold">{sh.count}</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1.5">
                {sh.name}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                {sh.desc}
              </p>
            </div>
            <button
              onClick={onExportExcel}
              className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Çalışma Kitabıyla İndir</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
