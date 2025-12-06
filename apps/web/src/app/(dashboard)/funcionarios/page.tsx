'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  UserCog,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Phone,
  Mail,
  Shield,
  Building2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/data-table/data-table';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { clinicsApi } from '@/lib/api/clinics';
import {
  Employee,
  EmployeeRole,
  getEmployeeRoleLabel,
  getEmployeeRoleColor,
} from '@/types/clinic';
import { getInitials, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function FuncionariosPage() {
  const router = useRouter();
  const [selectedClinicId, setSelectedClinicId] = React.useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);

  // Fetch clinics for filter
  const { data: clinicsData } = useQuery({
    queryKey: ['clinics-list'],
    queryFn: () => clinicsApi.list({ limit: 100 }),
  });

  // Fetch employees from selected clinic
  const { data: employees, isLoading, refetch } = useQuery({
    queryKey: ['employees', selectedClinicId],
    queryFn: async () => {
      if (selectedClinicId === 'all') {
        // Fetch from all clinics
        const allEmployees: Employee[] = [];
        for (const clinic of clinicsData?.data ?? []) {
          try {
            const emps = await clinicsApi.listEmployees(clinic.id);
            allEmployees.push(...emps.map(e => ({ ...e, clinicName: clinic.name })));
          } catch {
            // Ignore errors
          }
        }
        return allEmployees;
      }
      return clinicsApi.listEmployees(selectedClinicId);
    },
    enabled: !!clinicsData,
  });

  const clinics = clinicsData?.data ?? [];
  const employeesList = employees ?? [];

  // Stats
  const totalEmployees = employeesList.length;
  const activeEmployees = employeesList.filter((e) => e.isActive).length;
  const byRole = employeesList.reduce((acc, e) => {
    acc[e.role] = (acc[e.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const columns: ColumnDef<Employee & { clinicName?: string }>[] = [
    {
      accessorKey: 'user.fullName',
      header: 'Funcionario',
      cell: ({ row }) => {
        const employee = row.original;
        const name = employee.user?.fullName ?? 'N/A';

        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{name}</p>
              <p className="text-sm text-muted-foreground">
                {employee.user?.email}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'role',
      header: 'Cargo',
      cell: ({ row }) => {
        const role = row.original.role;
        return (
          <Badge className={getEmployeeRoleColor(role)}>
            {getEmployeeRoleLabel(role)}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'department',
      header: 'Departamento',
      cell: ({ row }) => row.original.department || '-',
    },
    {
      accessorKey: 'clinicName',
      header: 'Clinica',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span>{(row.original as any).clinicName || '-'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'hireDate',
      header: 'Admissao',
      cell: ({ row }) => formatDate(new Date(row.original.hireDate)),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
          {row.original.isActive ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const employee = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acoes</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalhes
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Shield className="mr-2 h-4 w-4" />
                Permissoes
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Remover
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Funcionarios' },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Funcionarios</h1>
          <p className="text-muted-foreground">
            Gerencie os funcionarios das clinicas
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Funcionario
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Funcionario</DialogTitle>
              <DialogDescription>
                Preencha os dados do novo funcionario
              </DialogDescription>
            </DialogHeader>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clinic">Clinica</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a clinica" />
                  </SelectTrigger>
                  <SelectContent>
                    {clinics.map((clinic) => (
                      <SelectItem key={clinic.id} value={clinic.id}>
                        {clinic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input id="name" placeholder="Nome do funcionario" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="email@exemplo.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" placeholder="(11) 99999-9999" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Cargo</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(EmployeeRole).map((role) => (
                      <SelectItem key={role} value={role}>
                        {getEmployeeRoleLabel(role)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Departamento</Label>
                <Input id="department" placeholder="Ex: Recepcao, Financeiro" />
              </div>
            </form>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => {
                toast.success('Funcionario adicionado com sucesso!');
                setIsAddDialogOpen(false);
              }}>
                Adicionar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              {activeEmployees} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recepcionistas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{byRole['RECEPTIONIST'] || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Enfermeiros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{byRole['NURSE'] || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Outros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalEmployees - (byRole['RECEPTIONIST'] || 0) - (byRole['NURSE'] || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter by Clinic */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={selectedClinicId} onValueChange={setSelectedClinicId}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Filtrar por clinica" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as clinicas</SelectItem>
                {clinics.map((clinic) => (
                  <SelectItem key={clinic.id} value={clinic.id}>
                    {clinic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Funcionarios</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os funcionarios cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={employeesList}
            searchKey="user.fullName"
            searchPlaceholder="Buscar por nome..."
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
