import React, { useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  EnhancedTable,
  type ColumnDef,
  type SelectionConfig,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
  Separator,
  useToast
} from './ui';
import { DataTable, createSortableHeader, createSelectionColumn, createActionColumn } from "@/components/ui/data-table"
import { AdvancedDataTable, createBadgeColumn, createNumericColumn, createDateColumn } from "@/components/ui/advanced-data-table"
import { ColumnDef as TanStackColumnDef } from "@tanstack/react-table"

const ComponentShowcase: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const { toast: showToast } = useToast();

  const handleToast = () => {
    showToast({
      title: "Component Test",
      description: "All shadcn/ui components are working with the theme system!",
    });
  };

  const sampleData = [
    { id: 1, name: "John Doe", role: "Alumni", status: "Active" },
    { id: 2, name: "Jane Smith", role: "Mentor", status: "Active" },
    { id: 3, name: "Bob Johnson", role: "Student", status: "Inactive" },
  ];

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">shadcn/ui Component Showcase</h1>
        <p className="text-muted-foreground">
          Testing all components with the theme system
        </p>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="data">Data Display</TabsTrigger>
          <TabsTrigger value="forms">Forms</TabsTrigger>
          <TabsTrigger value="interactive">Interactive</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Components</CardTitle>
              <CardDescription>
                Core UI components with theme integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button variant="default">Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
              
              <Separator />
              
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Grade Variants:</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="grade-a">Grade A</Badge>
                  <Badge variant="grade-b">Grade B</Badge>
                  <Badge variant="grade-c">Grade C</Badge>
                  <Badge variant="grade-d">Grade D</Badge>
                  <Badge variant="grade-f">Grade F</Badge>
                  <Badge variant="neutral">Neutral</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="grade-a" size="sm">Small</Badge>
                  <Badge variant="grade-b" size="default">Default</Badge>
                  <Badge variant="grade-c" size="lg">Large</Badge>
                </div>
              </div>

              <Separator />

              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">shadcn</p>
                  <p className="text-xs text-muted-foreground">@shadcn</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Display</CardTitle>
              <CardDescription>
                Tables and data presentation components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sampleData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.id}</TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.role}</TableCell>
                      <TableCell>
                        <Badge variant={item.status === 'Active' ? 'default' : 'secondary'}>
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Enhanced Table with Selection & Grade Badges</CardTitle>
              <CardDescription>
                Advanced table with selection checkboxes, group headers, and grade badge variants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EnhancedTableDemo />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>TanStack DataTable</CardTitle>
              <CardDescription>
                Professional data table with TanStack Table and shadcn/ui patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TanStackTableDemo />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Advanced DataTable (Recommended)</CardTitle>
              <CardDescription>
                Single, extensible table leveraging TanStack + shadcn/ui with helper utilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdvancedTableDemo />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Form Components</CardTitle>
              <CardDescription>
                Input fields and form controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" placeholder="Enter your name" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alumni">Alumni</SelectItem>
                      <SelectItem value="mentor">Mentor</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={checkboxChecked}
                  onCheckedChange={(checked) => setCheckboxChecked(checked === true)}
                />
                <Label htmlFor="terms">Accept terms and conditions</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interactive" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Interactive Components</CardTitle>
              <CardDescription>
                Dialogs, dropdowns, and interactive elements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">Open Dialog</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Component Test Dialog</DialogTitle>
                      <DialogDescription>
                        This dialog demonstrates the theme integration with shadcn/ui components.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => setIsDialogOpen(false)}>
                        Confirm
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">Open Menu</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Profile</DropdownMenuItem>
                    <DropdownMenuItem>Settings</DropdownMenuItem>
                    <DropdownMenuItem>Logout</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button onClick={handleToast}>Show Toast</Button>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                All components respond to theme changes automatically
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Enhanced Table Demo Component (based on VolunteerDashboard patterns)
function EnhancedTableDemo() {
  const [selectedRows, setSelectedRows] = useState<any[]>([]);

  // Sample data with volunteer-like structure
  const volunteerData = [
    {
      id: 1,
      name: 'Sarah Johnson',
      role: 'Team Lead',
      status: 'active',
      events: 4,
      hours: 24,
      preferences: '11/19'
    },
    {
      id: 2,
      name: 'Mike Chen',
      role: 'Coordinator',
      status: 'active',
      events: 6,
      hours: 32,
      preferences: '11/16'
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      role: 'Volunteer',
      status: 'pending',
      events: 2,
      hours: 8,
      preferences: '3/15'
    },
    {
      id: 4,
      name: 'David Park',
      role: 'Specialist',
      status: 'active',
      events: 5,
      hours: 28,
      preferences: '14/17'
    }
  ];

  // Column definitions with group headers and badge variants
  const columns: ColumnDef[] = [
    {
      key: 'name',
      label: 'Volunteer Name',
      groupHeader: 'Personal Information',
      width: 150,
      align: 'left'
    },
    {
      key: 'role',
      label: 'Role',
      groupHeader: 'Role & Status',
      width: 120,
      align: 'center',
      render: (value) => (
        <Badge
          variant={
            value === 'Team Lead' ? 'grade-a' :
            value === 'Coordinator' ? 'grade-b' :
            value === 'Specialist' ? 'grade-c' : 'neutral'
          }
        >
          {value}
        </Badge>
      )
    },
    {
      key: 'status',
      label: 'Status',
      groupHeader: 'Role & Status',
      width: 100,
      align: 'center',
      render: (value) => (
        <Badge
          variant={
            value === 'active' ? 'grade-a' :
            value === 'pending' ? 'grade-c' : 'grade-f'
          }
          size="sm"
        >
          {value.toUpperCase()}
        </Badge>
      )
    },
    {
      key: 'preferences',
      label: 'PREFS',
      groupHeader: 'Activity Summary',
      width: 100,
      align: 'center',
      render: (value) => (
        <Badge variant="grade-d" size="sm" className="font-mono">
          {value}
        </Badge>
      )
    },
    {
      key: 'events',
      label: 'Events',
      groupHeader: 'Activity Summary',
      width: 90,
      align: 'center',
      render: (value) => (
        <Badge variant="neutral" size="sm" className="font-mono">
          {value}
        </Badge>
      )
    },
    {
      key: 'hours',
      label: 'Hours',
      groupHeader: 'Activity Summary',
      width: 90,
      align: 'center',
      render: (value) => (
        <span className="font-mono font-semibold">{value}</span>
      )
    }
  ];

  const selectionConfig: SelectionConfig = {
    enabled: true,
    selectedRows,
    onSelectionChange: setSelectedRows,
    getRowId: (row) => row.id
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {selectedRows.length > 0 ? `${selectedRows.length} volunteers selected` : 'Select volunteers to see actions'}
        </p>
        {selectedRows.length > 0 && (
          <Button size="sm" variant="outline">
            Export Selected ({selectedRows.length})
          </Button>
        )}
      </div>

      <EnhancedTable
        data={volunteerData}
        columns={columns}
        selection={selectionConfig}
        frozenColumns={1} // Freeze name column
        onRowClick={(row) => console.log('Clicked row:', row)}
        className="border rounded-lg"
      />
    </div>
  );
}

// TanStack Table Demo Component
function TanStackTableDemo() {
  // Sample data for TanStack Table
  const data = [
    {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      role: "Team Lead",
      status: "Active",
      department: "Engineering",
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane@example.com",
      role: "Coordinator",
      status: "Active",
      department: "Marketing",
    },
    {
      id: "3",
      name: "Bob Johnson",
      email: "bob@example.com",
      role: "Specialist",
      status: "Pending",
      department: "Sales",
    },
    {
      id: "4",
      name: "Alice Brown",
      email: "alice@example.com",
      role: "Volunteer",
      status: "Inactive",
      department: "Support",
    },
  ];

  // TanStack Table column definitions
  const columns: TanStackColumnDef<typeof data[0]>[] = [
    createSelectionColumn(),
    {
      accessorKey: "name",
      header: createSortableHeader("Name"),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "email",
      header: createSortableHeader("Email"),
      cell: ({ row }) => (
        <div className="lowercase">{row.getValue("email")}</div>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("role") as string;
        const variant =
          role === 'Team Lead' ? 'grade-a' :
          role === 'Coordinator' ? 'grade-b' :
          role === 'Specialist' ? 'grade-c' : 'neutral';

        return <Badge variant={variant}>{role}</Badge>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const variant =
          status === 'Active' ? 'grade-a' :
          status === 'Pending' ? 'grade-c' : 'grade-f';

        return <Badge variant={variant} size="sm">{status}</Badge>;
      },
    },
    {
      accessorKey: "department",
      header: createSortableHeader("Department"),
    },
    createActionColumn(
      (row) => console.log('Edit:', row),
      (row) => console.log('Delete:', row),
      (row) => console.log('View:', row)
    ),
  ];

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Professional data table with sorting, filtering, pagination, and row selection
      </div>
      <DataTable
        columns={columns}
        data={data}
        searchKey="name"
        searchPlaceholder="Filter by name..."
      />
    </div>
  );
}

// Advanced Table Demo - Shows the power of helper utilities
function AdvancedTableDemo() {
  const [selectedRows, setSelectedRows] = React.useState<any[]>([]);

  // Sample data with more realistic fields
  const data = [
    {
      id: "EMP001",
      name: "John Doe",
      email: "john@company.com",
      role: "Team Lead",
      status: "Active",
      department: "Engineering",
      salary: 95000,
      joinDate: "2022-01-15",
      performance: 0.92,
    },
    {
      id: "EMP002",
      name: "Jane Smith",
      email: "jane@company.com",
      role: "Coordinator",
      status: "Active",
      department: "Marketing",
      salary: 75000,
      joinDate: "2022-03-20",
      performance: 0.88,
    },
    {
      id: "EMP003",
      name: "Bob Johnson",
      email: "bob@company.com",
      role: "Specialist",
      status: "Pending",
      department: "Sales",
      salary: 65000,
      joinDate: "2023-06-10",
      performance: 0.75,
    },
    {
      id: "EMP004",
      name: "Alice Brown",
      email: "alice@company.com",
      role: "Volunteer",
      status: "Inactive",
      department: "Support",
      salary: 45000,
      joinDate: "2021-11-05",
      performance: 0.82,
    },
  ];

  // Define columns using helper utilities - much cleaner!
  const columns = [
    {
      accessorKey: "id",
      header: "Employee ID",
      cell: ({ row }: { row: any }) => (
        <div className="font-mono text-sm">{row.getValue("id")}</div>
      ),
    },
    {
      accessorKey: "name",
      header: createSortableHeader("Name"),
      cell: ({ row }: { row: any }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }: { row: any }) => (
        <div className="text-muted-foreground">{row.getValue("email")}</div>
      ),
    },
    // Using helper utility for badge column
    createBadgeColumn("role", "Role"),
    createBadgeColumn("status", "Status"),
    {
      accessorKey: "department",
      header: createSortableHeader("Department"),
    },
    // Using helper utility for currency formatting
    createNumericColumn("salary", "Salary", "currency"),
    // Using helper utility for date formatting
    createDateColumn("joinDate", "Join Date", "short"),
    // Using helper utility for percentage formatting
    createNumericColumn("performance", "Performance", "percentage"),
    // Using helper utility for actions
    createActionColumn({
      onView: (row: any) => console.log('View employee:', row),
      onEdit: (row: any) => console.log('Edit employee:', row),
      onDelete: (row: any) => console.log('Delete employee:', row),
      onCustom: [
        { label: "Send Email", action: (row: any) => console.log('Email:', row.email) },
        { label: "View Profile", action: (row: any) => console.log('Profile:', row.id) },
      ]
    }),
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Extensible table with automatic badges, formatting, and actions
        </div>
        {selectedRows.length > 0 && (
          <div className="text-sm font-medium">
            {selectedRows.length} employee(s) selected
          </div>
        )}
      </div>

      <AdvancedDataTable
        columns={columns}
        data={data}
        searchKey="name"
        searchPlaceholder="Search employees..."
        // Enhanced selection configuration
        selection={{
          enabled: true,
          mode: 'multiple',
          showSelectAll: true,
          selectAllText: "Select all employees",
          selectedRowClassName: "bg-primary/5 border-l-2 border-primary"
        }}
        onSelectionChange={setSelectedRows}
        // Enhanced group headers
        groupHeaders={[
          { label: "Personal Information", columns: ["name", "email"] },
          { label: "Work Details", columns: ["role", "department", "status"] },
          { label: "Performance", columns: ["salary", "performance", "joinDate"] }
        ]}
        // Frozen columns for better UX
        frozenColumns={{
          count: 2,
          shadowIntensity: 'medium'
        }}
        // Mobile optimization
        mobile={{
          enabled: true,
          hideColumns: ["department", "joinDate"],
          touchFriendly: true
        }}
        pageSize={5}
        enablePagination={true}
        onRowClick={(row) => console.log('Clicked employee:', row)}
      />
    </div>
  );
}

export default ComponentShowcase;
