import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Trophy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { User } from "firebase/auth";
import { Separator } from "@/components/ui/separator";

const Register = () => {
  const location = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    gender: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(location.state?.isNewUser ? 2 : 1);
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const { signUp, signInWithGoogle, signUpWithGoogle, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.isNewUser && user) {
      setGoogleUser(user);
      toast({
        title: "Profile Update Required",
        description: "Please update your profile details to complete registration.",
      });
      // Clear state so refresh doesn't trigger it again? 
      // Actually navigate replaces history but checks are fine.
      window.history.replaceState({}, document.title);
    }
  }, [location.state, user]);

  useEffect(() => {
    // Only redirect if user is logged in AND we are not in the middle of Google registration (step 2) 
    // AND the user is verified (if they logged in manually).
    // Note: Manual signup signs out immediately, so this effect won't trigger for them.
    if (user && step === 1) {
      navigate('/');
    }
  }, [user, navigate, step]);

  const handleManualRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signUp(formData.email, formData.password, {
        name: formData.name,
        department: formData.department,
        gender: formData.gender,
        phone: formData.phone
      });

      if (error) {
        toast({
          title: "Registration failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Registration successful!",
          description: "A verification email has been sent to your email address. Please verify it before logging in."
        });
        // Redirect to login page
        navigate('/login');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error, user: googleUserData, isNewUser } = await signInWithGoogle();

      if (error) {
        toast({
          title: "Google sign-in failed",
          description: error.message,
          variant: "destructive"
        });
      } else if (googleUserData && isNewUser) {
        setGoogleUser(googleUserData);
        toast({
          title: "Profile Update Required",
          description: "Please update your profile details to complete registration.",
        });
        setStep(2);
      } else if (googleUserData && !isNewUser) {
        // User already exists, redirect to home
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteGoogleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signUpWithGoogle({
        department: formData.department,
        gender: formData.gender
      });

      if (error) {
        toast({
          title: "Registration failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Registration successful!",
          description: "Welcome to SportsBracket!"
        });
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-4">
            <Trophy className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">SportsBracket</span>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{step === 1 ? "Create Account" : "Complete Profile"}</CardTitle>
            <CardDescription>
              {step === 1
                ? "Register manually or with Google to participate"
                : "Please provide additional details to complete your registration"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 ? (
              <div className="space-y-6">
                <form onSubmit={handleManualRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department / Class</Label>
                    <Input
                      id="department"
                      placeholder="Ex: CSE-A"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="******"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                  <Button className="w-full" type="submit" disabled={loading}>
                    {loading ? "Registering..." : "Register"}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  variant="outline"
                  type="button"
                >
                  <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                  </svg>
                  Google
                </Button>

                <div className="text-center text-sm">
                  <span className="text-muted-foreground">Already have an account? </span>
                  <Link to="/login" className="text-primary hover:underline">
                    Login here
                  </Link>
                </div>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleCompleteGoogleRegistration}>
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={googleUser?.displayName || ""}
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={googleUser?.email || ""}
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department-google">Department / Class</Label>
                  <Input
                    id="department-google"
                    placeholder="Enter your department or class"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender-google">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                    <SelectTrigger id="gender-google">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full" type="submit" disabled={loading}>
                  {loading ? "Completing registration..." : "Complete Registration"}
                </Button>

                <div className="text-center">
                  <Button
                    variant="ghost"
                    onClick={() => setStep(1)}
                    className="text-sm"
                    type="button"
                  >
                    Back
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
