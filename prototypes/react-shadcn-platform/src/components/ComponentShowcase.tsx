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
import { PlaceholderDash } from './ui/placeholder-dash';
import { Briefcase, Star, Clock, Eye } from 'lucide-react';

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
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Basic Badge Variants:</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge>Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <Badge variant="destructive">Destructive</Badge>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Grade Variants:</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="grade-a">Grade A</Badge>
                    <Badge variant="grade-b">Grade B</Badge>
                    <Badge variant="grade-c">Grade C</Badge>
                    <Badge variant="grade-d">Grade D</Badge>
                    <Badge variant="grade-f">Grade F</Badge>
                    <Badge variant="neutral">Neutral</Badge>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Size Variants:</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="grade-a" size="sm">Small</Badge>
                    <Badge variant="grade-b" size="default">Default</Badge>
                    <Badge variant="grade-c" size="lg">Large</Badge>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Domain & Technology Tags:</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Technology</Badge>
                    <Badge variant="outline">Software Engineering</Badge>
                    <Badge variant="outline">Artificial Intelligence</Badge>
                    <Badge variant="outline">Data Science</Badge>
                    <Badge variant="outline">Product Management</Badge>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Badges with Icons:</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default">
                      <Briefcase className="h-4 w-4 mr-1" />
                      Job Offer
                    </Badge>
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      Expires in 5 days
                    </Badge>
                    <Badge variant="outline">
                      <Eye className="h-3 w-3 mr-1" />
                      156 views
                    </Badge>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Count & Content Props:</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge count={5} variant="default" />
                    <Badge count={12} variant="secondary" />
                    <Badge count={150} max={99} variant="destructive" />
                    <Badge content="Technology" variant="outline" />
                    <Badge content="High Priority" variant="destructive" />
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Real-world Example (Browse Postings Style):</p>
                  <div className="border rounded-lg p-4 bg-card">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="default">
                        <Briefcase className="h-4 w-4" />
                        <span className="ml-1 capitalize">offer</span>
                      </Badge>
                      <Badge variant="destructive">
                        high priority
                      </Badge>
                      <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    </div>
                    <h4 className="text-sm font-semibold mb-2">Senior Software Engineer Position</h4>
                    <div className="flex flex-wrap gap-1 mb-2">
                      <Badge variant="outline" size="sm">React</Badge>
                      <Badge variant="outline" size="sm">Node.js</Badge>
                      <Badge variant="outline" size="sm">AWS</Badge>
                      <Badge variant="outline" size="sm">Full-time</Badge>
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        249d ago
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        156 views
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Placeholder Dash vs Badge Comparison:</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-20">Placeholders:</span>
                      <PlaceholderDash variant="default" />
                      <PlaceholderDash variant="thick" />
                      <PlaceholderDash variant="thin" />
                      <PlaceholderDash variant="dot" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-20">Actual Badges:</span>
                      <Badge variant="outline" size="sm">Technology</Badge>
                      <Badge variant="default" size="sm">Active</Badge>
                      <Badge variant="secondary" size="sm">Medium</Badge>
                      <Badge variant="destructive" size="sm">High</Badge>
                    </div>
                  </div>
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

export default ComponentShowcase;

