// Sign in / Sign up page with role selection and optional farmer data
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Leaf, Sprout, User, Building, Shield } from "lucide-react";
import heroImage from "@/assets/hero-farmer.jpg";

// Farmer-specific data interface
interface FarmerData {
  farmSize?: string;
  farmType?: string;
  yearsExperience?: string;
  mainCrops?: string[];
  annualRevenue?: string;
  location?: string;
}

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [signupRole, setSignupRole] = useState<'farmer'|'buyer'|'microfinancer'|'none'>('none');
  const [signinRole, setSigninRole] = useState<'farmer'|'buyer'|'microfinancer'|'none'>('none');
  
  // Farmer registration data
  const [farmerData, setFarmerData] = useState<FarmerData>({});

  const handleFarmerDataChange = (field: keyof FarmerData, value: string) => {
    setFarmerData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("signup-email") as string;
    const password = formData.get("signup-password") as string;
    const name = formData.get("name") as string;

    try {
      const siteUrl = import.meta.env.VITE_SITE_URL || 'https://mazao-credit.netlify.app';
      // First, create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${siteUrl}/`,
          data: { 
            full_name: name, 
            role: signupRole !== 'none' ? signupRole : undefined 
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create user profile in our backend
        const userProfile = {
          userId: authData.user.id,
          name,
          email,
          password, // This will be hashed by the backend
          role: signupRole,
          ...(signupRole === 'farmer' && {
            farmData: {
              farmSize: parseFloat(farmerData.farmSize || "0"),
              farmType: farmerData.farmType || "traditional",
              yearsExperience: parseInt(farmerData.yearsExperience || "0"),
              mainCrops: farmerData.mainCrops || [],
            },
            financialData: {
              annualRevenue: parseFloat(farmerData.annualRevenue || "0"),
            },
            locationData: {
              region: farmerData.location || "",
            }
          })
        };

        // Send to our backend API
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://mazao-credit-backend.onrender.com'}/api/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userProfile),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || 'Failed to create user profile');
        }

        // Auto-run credit analysis for farmers using provided inputs (simplified flow)
        if (signupRole === 'farmer') {
          try {
            const body = {
              farmData: {
                farmSize: parseFloat(farmerData.farmSize || '0'),
                farmType: farmerData.farmType || 'traditional',
                yearsExperience: parseInt(farmerData.yearsExperience || '0'),
                mainCrops: farmerData.mainCrops || []
              },
              financialData: {
                annualRevenue: parseFloat(farmerData.annualRevenue || '0')
              },
              locationData: {
                region: farmerData.location || '',
                country: 'Kenya'
              }
            };
            await fetch(`${import.meta.env.VITE_API_URL || 'https://mazao-credit-backend.onrender.com'}/api/auth/credit-analysis/${authData.user.id}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
            });
          } catch {}
        }

        toast({
          title: "Success!",
          description: "Account created successfully! Check your email to verify your account.",
        });

        // Go straight to dashboard for simplicity
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("signin-email") as string;
    const password = formData.get("signin-password") as string;

    try {
      // Sign in with Supabase Auth
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // Update role if selected
      if (signinRole !== 'none') {
        await supabase.auth.updateUser({ data: { role: signinRole } });
      }

      // Get user data from our backend
      const userResponse = await fetch(`${import.meta.env.VITE_API_URL || 'https://mazao-credit-backend.onrender.com'}/api/users/${signInData.user.id}`);
      const userResult = await userResponse.json();

      toast({ 
        title: "Welcome back!", 
        description: "You've successfully signed in." 
      });

      // Navigate based on role
      const role = (signInData.user?.user_metadata as any)?.role as string | undefined;
      if (role === 'buyer') navigate('/marketplace');
      else if (role === 'microfinancer') navigate('/partner-dashboard');
      else if (role === 'farmer') navigate('/dashboard');
      else navigate('/');

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderFarmerRegistrationForm = () => (
    <div className="space-y-4 border-t pt-4">
      <h4 className="font-semibold text-primary flex items-center gap-2">
        <Leaf className="w-4 h-4" />
        Farm Information for Credit Assessment
      </h4>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="farmSize">Farm Size (acres/hectares)</Label>
          <Input
            id="farmSize"
            type="number"
            placeholder="e.g., 25"
            value={farmerData.farmSize || ""}
            onChange={(e) => handleFarmerDataChange("farmSize", e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="yearsExperience">Years Farming</Label>
          <Input
            id="yearsExperience"
            type="number"
            placeholder="e.g., 5"
            value={farmerData.yearsExperience || ""}
            onChange={(e) => handleFarmerDataChange("yearsExperience", e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="farmType">Farm Type</Label>
        <Select 
          value={farmerData.farmType || ""} 
          onValueChange={(value) => handleFarmerDataChange("farmType", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select farm type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="organic">Organic</SelectItem>
            <SelectItem value="traditional">Traditional</SelectItem>
            <SelectItem value="hydroponic">Hydroponic</SelectItem>
            <SelectItem value="greenhouse">Greenhouse</SelectItem>
            <SelectItem value="mixed">Mixed Farming</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="annualRevenue">Annual Revenue (KES)</Label>
        <Input
          id="annualRevenue"
          type="number"
          placeholder="e.g., 120000"
          value={farmerData.annualRevenue || ""}
          onChange={(e) => handleFarmerDataChange("annualRevenue", e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Region/Location</Label>
        <Input
          id="location"
          placeholder="e.g., Central Kenya"
          value={farmerData.location || ""}
          onChange={(e) => handleFarmerDataChange("location", e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          💡 This information helps us assess your creditworthiness and connect you with suitable financing options.
        </p>
      </div>
    </div>
  );

  const renderRoleIcon = (role: string) => {
    switch (role) {
      case 'farmer':
        return <Leaf className="w-4 h-4" />;
      case 'buyer':
        return <User className="w-4 h-4" />;
      case 'microfinancer':
        return <Building className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Leaf className="absolute top-20 left-10 w-16 h-16 text-primary/20 animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }} />
        <Sprout className="absolute bottom-32 right-20 w-20 h-20 text-secondary/20 animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }} />
        <Leaf className="absolute top-1/3 right-32 w-12 h-12 text-accent/20 animate-bounce" style={{ animationDelay: '2s', animationDuration: '3.5s' }} />
      </div>

      <Card className="w-full max-w-md shadow-elevated relative z-10 animate-fade-in border-2 border-primary/20">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10 animate-pulse">
              <Sprout className="w-12 h-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Mazao Credit</CardTitle>
          <CardDescription className="text-base">
            Join the resilient farmer community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    name="signin-email"
                    type="email"
                    placeholder="farmer@example.com"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    name="signin-password"
                    type="password"
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-role">I am a</Label>
                  <Select onValueChange={(v)=>setSigninRole(v as any)}>
                    <SelectTrigger id="signin-role">
                      <SelectValue placeholder="Select role (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="farmer">
                        <div className="flex items-center gap-2">
                          {renderRoleIcon('farmer')}
                          Farmer (selling)
                        </div>
                      </SelectItem>
                      <SelectItem value="buyer">
                        <div className="flex items-center gap-2">
                          {renderRoleIcon('buyer')}
                          Buyer (buying)
                        </div>
                      </SelectItem>
                      <SelectItem value="microfinancer">
                        <div className="flex items-center gap-2">
                          {renderRoleIcon('microfinancer')}
                          Microfinancer
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="John Kamau"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="signup-email"
                    type="email"
                    placeholder="farmer@example.com"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    name="signup-password"
                    type="password"
                    placeholder="••••••••"
                    required
                    minLength={6}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-role">I am a</Label>
                  <Select 
                    value={signupRole} 
                    onValueChange={(v) => setSignupRole(v as any)}
                  >
                    <SelectTrigger id="signup-role">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="farmer">
                        <div className="flex items-center gap-2">
                          {renderRoleIcon('farmer')}
                          Farmer (selling)
                        </div>
                      </SelectItem>
                      <SelectItem value="buyer">
                        <div className="flex items-center gap-2">
                          {renderRoleIcon('buyer')}
                          Buyer (buying)
                        </div>
                      </SelectItem>
                      <SelectItem value="microfinancer">
                        <div className="flex items-center gap-2">
                          {renderRoleIcon('microfinancer')}
                          Microfinancer
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Show farmer-specific form when farmer is selected */}
                {signupRole === 'farmer' && renderFarmerRegistrationForm()}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;