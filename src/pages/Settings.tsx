import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataExport } from "@/components/DataExport";
import { PrivacyCenter } from "@/components/PrivacyCenter";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { 
  User, Shield, Download, Trash2, Loader2, Save, 
  AlertTriangle, LogOut, CheckCircle
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Settings() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  
  const [displayName, setDisplayName] = useState("");
  const [university, setUniversity] = useState("");
  const [major, setMajor] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("");
  const [bio, setBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setUniversity(profile.university || "");
      setMajor(profile.major || "");
      setYearOfStudy(profile.year_of_study || "");
      setBio(profile.bio || "");
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          university,
          major,
          year_of_study: yearOfStudy,
          bio,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Profile saved",
        description: "Your profile has been updated.",
      });
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAllData = async () => {
    if (!user) return;

    setIsDeleting(true);
    try {
      // Delete in order: proof_cards, activities, growth_metrics, skills
      await supabase.from("proof_cards").delete().eq("user_id", user.id);
      await supabase.from("activities").delete().eq("user_id", user.id);
      await supabase.from("growth_metrics").delete().eq("user_id", user.id);
      await supabase.from("skills").delete().eq("user_id", user.id);

      toast({
        title: "Data deleted",
        description: "All your learning data has been permanently deleted.",
      });

      // Refresh the page
      window.location.reload();
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: "Failed to delete data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-16">
        <header className="border-b border-border bg-card/50">
          <div className="container max-w-4xl mx-auto px-4 py-6">
            <h1 className="text-2xl font-display font-semibold">Settings</h1>
            <p className="text-muted-foreground">Manage your profile, privacy, and data</p>
          </div>
        </header>

        <main className="container max-w-4xl mx-auto px-4 py-8">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile" className="gap-2">
                <User className="w-4 h-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="privacy" className="gap-2">
                <Shield className="w-4 h-4" />
                Privacy
              </TabsTrigger>
              <TabsTrigger value="data" className="gap-2">
                <Download className="w-4 h-4" />
                Your Data
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    This information helps contextualize your learning journey
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={user?.email || ""}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="university">University</Label>
                      <Input
                        id="university"
                        value={university}
                        onChange={(e) => setUniversity(e.target.value)}
                        placeholder="Your university"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="major">Major</Label>
                      <Input
                        id="major"
                        value={major}
                        onChange={(e) => setMajor(e.target.value)}
                        placeholder="Your major"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="yearOfStudy">Year of Study</Label>
                      <Input
                        id="yearOfStudy"
                        value={yearOfStudy}
                        onChange={(e) => setYearOfStudy(e.target.value)}
                        placeholder="e.g., Junior, 3rd Year"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio (Optional)</Label>
                    <Input
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="A brief description of yourself"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleSaveProfile} disabled={isSaving}>
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Sign Out */}
              <Card>
                <CardHeader>
                  <CardTitle>Session</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Privacy Tab */}
            <TabsContent value="privacy">
              <PrivacyCenter />
            </TabsContent>

            {/* Data Tab */}
            <TabsContent value="data" className="space-y-6">
              {/* Data Export */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    Export Your Data
                  </CardTitle>
                  <CardDescription>
                    Download all data PROOF has stored about your learning journey
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Your data belongs to you. Export it anytime in JSON or readable format.
                      </p>
                    </div>
                    <DataExport />
                  </div>
                </CardContent>
              </Card>

              {/* Data Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>What PROOF Stores</CardTitle>
                  <CardDescription>
                    A summary of all data categories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span className="font-medium">Profile</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Name, email, university, major (optional)
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span className="font-medium">Skills</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Skills you're tracking and their progress
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span className="font-medium">Activities</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Learning sessions and their metadata
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span className="font-medium">Learning Signals</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Edit cycles, runs, error corrections (not keystrokes)
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span className="font-medium">Proof Cards</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Generated evidence summaries and sharing status
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span className="font-medium">AI Analysis</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Insights generated about your learning patterns
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Delete Data */}
              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <Trash2 className="w-5 h-5" />
                    Delete All Data
                  </CardTitle>
                  <CardDescription>
                    Permanently delete all your learning data from PROOF
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        This action is irreversible. All skills, activities, and proof cards will be permanently deleted.
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="gap-2">
                          <Trash2 className="w-4 h-4" />
                          Delete All Data
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                            Are you absolutely sure?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete:
                            <ul className="list-disc list-inside mt-2 space-y-1">
                              <li>All your tracked skills</li>
                              <li>All logged activities</li>
                              <li>All learning signals and metrics</li>
                              <li>All generated Proof Cards</li>
                            </ul>
                            <p className="mt-2 font-medium">
                              This action cannot be undone. Your profile will remain, but all learning data will be gone.
                            </p>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteAllData}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Yes, delete everything"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
