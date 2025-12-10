// app/profile/page.tsx
"use client";

import {
  useSessionQuery,
  useChangePasswordMutation,
} from "@/lib/redux/authSlice";
import {
  useUpdateUserMutation,
  useUpdateUserPictureMutation,
  useDeleteUserMutation,
} from "@/lib/redux/userSlice";
import {
  useRequestVerificationCodeMutation,
  useVerifyEmailMutation,
  resetVerificationState,
} from "@/lib/redux/verificationSlice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";

export default function ProfilePage() {
  const [user] = useState({
    name: "Kristin Watson",
    role: "Personal Account",
    avatar: "/placeholder.svg?height=40&width=40",
  });
  const {
    data: sessionData = { user: { settings: [] } },
    isLoading: isSessionLoading,
    refetch: refetchSession,
  } = useSessionQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
    pollingInterval: 300000, // Poll every 5 minutes
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteInProgress, setIsDeleteInProgress] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [requestVerificationCode, { isLoading: isSendingCode }] =
    useRequestVerificationCodeMutation();
  const [verifyEmail, { isLoading: isVerifying }] = useVerifyEmailMutation();
  const { toast } = useToast();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  const [changePassword, { isLoading: isChangingPasswordState }] =
    useChangePasswordMutation();
  const [updateUserPicture, { isLoading: isUpdatingPicture }] =
    useUpdateUserPictureMutation();
  // Initialize form data with session data
  const [formData, setFormData] = useState(() => ({
    username: "",
    email: "",
  }));

  // Update form data when session data is available
  useEffect(() => {
    if (sessionData?.user) {
      setFormData({
        username: sessionData.user.username || "",
        email: sessionData.user.email || "",
      });
    }
  }, [sessionData]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionData?.user?.id) return;

    try {
      // Update username if it has changed
      if (formData.username !== sessionData.user.username) {
        await updateUser({
          id: sessionData.user.id,
          username: formData.username,
        }).unwrap();
      }

      // Update profile picture if a new file was selected
      if (selectedFile) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64String = reader.result as string;
          try {
            await updateUserPicture({
              id: sessionData.user.id,
              image: selectedFile,
            }).unwrap();
            setSelectedFile(null);
          } catch (error) {
            console.error("Failed to update profile picture:", error);
            toast({
              title: "Error",
              description:
                "Failed to update profile picture. Please try again.",
              variant: "destructive",
            });
            return;
          }
        };
        reader.readAsDataURL(selectedFile);
      }

      toast({
        title: "Success",
        description: "Your profile has been updated successfully.",
      });
      setIsEditing(false);
      refetchSession(); // Refresh session data
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };
  console.log("user", sessionData.user);
  return (
    <>
      <div className="container  overflow-y-auto mx-auto px-4 max-sm:px-2 py-8 max-sm:py-4">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center  justify-between">
                <CardTitle className="text-[17px]">
                  Personal Information
                </CardTitle>
                {!isEditing && (
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    disabled={isUpdating}
                  >
                    Edit Profile
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center mb-8">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage
                    src={
                      `${process.env.NEXT_PUBLIC_API_URL}/${sessionData?.user?.image_url}` ||
                      ""
                    }
                    className="object-cover"
                  />
                  <AvatarFallback>
                    {sessionData?.user?.username?.charAt(0).toUpperCase() ||
                      "U"}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <div>
                    <input
                      type="file"
                      id="profile-picture"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                      disabled={isUpdating || isUpdatingPicture}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="mb-4"
                      asChild
                    >
                      <label htmlFor="profile-picture">
                        {selectedFile
                          ? "Change Selected Photo"
                          : "Change Photo"}
                      </label>
                    </Button>
                    {selectedFile && (
                      <p className="text-xs text-muted-foreground text-center">
                        {selectedFile.name} (
                        {(selectedFile.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="username">Full Name</Label>
                    {isEditing ? (
                      <Input
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {sessionData?.user?.username || "Not provided"}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <p className="text-sm text-muted-foreground">
                      {sessionData?.user?.email || "No email available"}
                    </p>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end space-x-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        // Reset form on cancel
                        setFormData({
                          username: sessionData?.user?.username || "",
                          email: sessionData?.user?.email || "",
                        });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={!isEditing || isUpdating}>
                      {isUpdating ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center max-sm:flex-col max-sm:justify-center max-sm:items-start max-sm:space-y-[15px] justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Change Password</h3>
                  <p className="text-sm text-muted-foreground">
                    Set a new password for your account
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setIsChangePasswordOpen(true)}
                  // disabled={
                  // isChangingPasswordState ||
                  // isVerifying ||
                  // !verificationCode || !newPassword || !confirmPassword
                  // }
                >
                  {isChangingPasswordState || isVerifying
                    ? "Processing..."
                    : "Update Password"}
                </Button>
              </div>
              <div className="flex items-center max-sm:flex-col max-sm:justify-center max-sm:items-start max-sm:space-y-[15px] justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Delete Account</h3>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete Account"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsDeleteDialogOpen(false);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogCancel className="absolute right-4 top-4 h-[30px] rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2  disabled:pointer-events-none">
            <span className="sr-only">Close</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </AlertDialogCancel>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                This action cannot be undone. This will permanently delete your
                account and remove all associated data from our servers.
                <div className="font-medium text-foreground">
                  Type <span className="text-destructive">DELETE</span> to
                  confirm:
                </div>
                <Input
                  id="confirm-delete"
                  className="mt-2"
                  placeholder="Type DELETE to confirm"
                  onChange={(e) => {
                    if (e.target.value === "DELETE") {
                      e.target.classList.remove("border-destructive");
                    } else {
                      e.target.classList.add("border-destructive");
                    }
                  }}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={async (e) => {
                e.preventDefault();
                const input = document.getElementById(
                  "confirm-delete"
                ) as HTMLInputElement;
                if (input?.value !== "DELETE") {
                  input?.focus();
                  return;
                }

                try {
                  setIsDeleteInProgress(true);
                  await deleteUser({
                    id: sessionData.user.id,
                    company_id: sessionData.user.company_id || "",
                  }).unwrap();

                  toast({
                    title: "Account Deleted",
                    description: "Your account has been successfully deleted.",
                  });

                  // Sign out and redirect to home page
                  window.location.href = "/";
                } catch (error) {
                  console.error("Failed to delete account:", error);
                  toast({
                    title: "Error",
                    description: "Failed to delete account. Please try again.",
                    variant: "destructive",
                  });
                } finally {
                  setIsDeleteInProgress(false);
                  setIsDeleteDialogOpen(false);
                }
              }}
            >
              {isDeleting ? "Deleting..." : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Password Verification Dialog */}
      <AlertDialog
        open={isChangePasswordOpen}
        onOpenChange={(open) => {
          if (!open) {
            // Reset all form states when closing
            setIsChangePasswordOpen(false);
            setIsVerificationSent(false);
            setVerificationCode("");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
          } else {
            // When opening, ensure the modal is in initial state
            setIsVerificationSent(false);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogCancel className="absolute right-4 top-4 h-[30px]  rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
            <span className="sr-only">Close</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </AlertDialogCancel>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Password</AlertDialogTitle>
            <AlertDialogDescription asChild>
              {!isVerificationSent ? (
                <div className="space-y-4">
                  <p>
                    We'll send a verification code to your email to confirm your
                    identity.
                  </p>
                  <Button
                    className="w-full"
                    onClick={async () => {
                      try {
                        setIsChangingPassword(true);
                        await requestVerificationCode({
                          email: sessionData.user.email,
                        }).unwrap();

                        setIsVerificationSent(true);
                        toast({
                          title: "Verification sent",
                          description:
                            "We've sent a verification code to your email.",
                        });
                      } catch (error) {
                        console.error("Verification error:", error);
                        toast({
                          title: "Error",
                          description:
                            "Failed to send verification code. Please try again.",
                          variant: "destructive",
                        });
                      } finally {
                        setIsChangingPassword(false);
                      }
                    }}
                    disabled={isChangingPassword || isSendingCode}
                  >
                    {isSendingCode ? "Sending..." : "Send Verification Code"}
                  </Button>
                </div>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();

                    if (!currentPassword) {
                      toast({
                        title: "Error",
                        description: "Please enter your current password.",
                        variant: "destructive",
                      });
                      return;
                    }

                    if (newPassword !== confirmPassword) {
                      toast({
                        title: "Error",
                        description: "Passwords do not match.",
                        variant: "destructive",
                      });
                      return;
                    }

                    if (newPassword.length < 8) {
                      toast({
                        title: "Error",
                        description:
                          "Password must be at least 8 characters long.",
                        variant: "destructive",
                      });
                      return;
                    }

                    try {
                      setIsChangingPassword(true);

                      // First verify the email with the code
                      let response = await verifyEmail({
                        email: sessionData.user.email,
                        code: verificationCode,
                      }).unwrap();
                      console.log("response (ver)", response);
                      if (response.success) {
                        // If verification is successful, proceed with password change
                        // Note: currentPassword is not available in this flow, consider updating the API or flow
                        await changePassword({
                          currentPassword: currentPassword,
                          newPassword: newPassword,
                          confirmPassword: confirmPassword,
                        }).unwrap();

                        toast({
                          title: "Success",
                          description:
                            "Your password has been updated successfully.",
                        });
                      } else {
                        toast({
                          title: "Error",
                          description: response.message,
                          variant: "destructive",
                        });
                        throw new Error(response.message);
                      }
                      // Reset form and close modal
                      setIsChangePasswordOpen(false);
                      setIsVerificationSent(false);
                      setVerificationCode("");
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                      resetVerificationState();
                    } catch (error) {
                      console.error("Password change error:", error);
                      toast({
                        title: "Error",
                        description:
                          error?.data?.message ||
                          "Failed to change password. Please check the verification code and try again.",
                        variant: "destructive",
                      });
                    } finally {
                      setIsChangingPassword(false);
                    }
                  }}
                  className="space-y-4"
                >
                  {isVerificationSent ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="verificationCode">
                          Verification Code
                        </Label>
                        <Input
                          id="verificationCode"
                          type="text"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          placeholder="Enter 6-digit code"
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">
                          Current Password
                        </Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter your current password"
                          className="w-full"
                        />
                      </div>
                    </div>
                  ) : null}
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                      minLength={8}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                      minLength={8}
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (isVerificationSent) {
                          // If verification was sent, just go back to verification step
                          setIsVerificationSent(false);
                          setVerificationCode("");
                        } else {
                          // If on first step, close the modal
                          setIsChangePasswordOpen(false);
                        }
                      }}
                      disabled={isChangingPassword}
                    >
                      {isVerificationSent ? "Back" : "Cancel"}
                    </Button>
                    <Button type="submit" disabled={isChangingPassword}>
                      {isChangingPassword ? "Updating..." : "Update Password"}
                    </Button>
                  </div>
                </form>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
