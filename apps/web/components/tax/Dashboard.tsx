import { TaxResult } from "@/lib/tax-engine/types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export function TaxDashboard({ result }: { result: TaxResult }) {
    
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Impuesto a Cargo</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(result.totalIncomeTax)}</div>
                    <p className="text-xs text-muted-foreground">Antes de retenciones</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Saldo a Pagar</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-600">{formatCurrency(result.balanceToPay)}</div>
                    <p className="text-xs text-muted-foreground">Después de retenciones ({formatCurrency(result.totalWithholding)})</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ingreso Neto Total</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(result.cedulaGeneral.netIncome)}</div>
                    <p className="text-xs text-muted-foreground">Base para depuración</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Deducciones Aceptadas</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(result.cedulaGeneral.acceptedClaims)}</div>
                    <p className="text-xs text-muted-foreground">Limitadas al 40% / 1340 UVT</p>
                </CardContent>
            </Card>
        </div>
    );
}
