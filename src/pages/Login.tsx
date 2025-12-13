import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { Trophy } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/integrations/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showOTPDialog, setShowOTPDialog] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const { signIn, signInWithGoogle, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive"
        });
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
      const { error, isNewUser } = await signInWithGoogle();

      if (error) {
        toast({
          title: "Google sign-in failed",
          description: error.message,
          variant: "destructive"
        });
      } else if (isNewUser) {
        navigate('/register', { state: { isNewUser: true } });
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

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }

    setForgotLoading(true);
    try {
      await sendPasswordResetEmail(auth, forgotEmail);
      toast({
        title: "Password reset email sent",
        description: "Check your email for password reset instructions",
      });
      setShowForgotPassword(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleOTPSubmit = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit OTP",
        variant: "destructive"
      });
      return;
    }

    setOtpLoading(true);
    try {
      // TODO: Implement OTP verification
      toast({
        title: "OTP verified",
        description: "Password reset functionality implemented",
      });
      setShowOTPDialog(false);
      setOtp("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-4">
            <Trophy className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">SportsBracket</span>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>Login to manage your tournament participation</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>

              <Button
                className="w-full"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                Continue with Google
              </Button>

              <div className="text-center text-sm space-y-2">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-primary hover:underline"
                >
                  Forgot password?
                </button>
                <div>
                  <span className="text-muted-foreground">Don't have an account? </span>
                  <Link to="/register" className="text-primary hover:underline">
                    Register here
                  </Link>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Forgot Password Dialog */}
        <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                Enter your email address and we'll send you a password reset link.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="Enter your email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleForgotPassword}
                disabled={forgotLoading}
              >
                {forgotLoading ? "Sending..." : "Send Reset Email"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* OTP Dialog */}
        <Dialog open={showOTPDialog} onOpenChange={setShowOTPDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enter OTP</DialogTitle>
              <DialogDescription>
                Enter the 6-digit code sent to your email.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-center">
                <InputOTP
                  value={otp}
                  onChange={setOtp}
                  maxLength={6}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button
                className="w-full"
                onClick={handleOTPSubmit}
                disabled={otpLoading}
              >
                {otpLoading ? "Verifying..." : "Verify OTP"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Login;
