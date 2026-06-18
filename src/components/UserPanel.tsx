import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { usersApi } from "@/lib/api";
import { showPrettyError } from "@/lib/error";
import { useUserStore } from "@/lib/store";
import { useMutation } from "@tanstack/react-query";
import { LogIn, UserCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function UserPanel() {
  const { user, setUser, clearUser } = useUserStore();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const { mutate: register, isPending } = useMutation({
    mutationFn: () => usersApi.register({ username: username.trim(), email: email.trim() }),
    onSuccess: (res) => {
      setUser(res.data.data);
      toast.success(`Welcome, @${res.data.data.username}!`);
      setUsername("");
      setEmail("");
    },
    onError: (err) => {
      showPrettyError(err)
    },
  });

  if (user) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <UserCircle className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">@{user.username}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={clearUser}
        >
          Switch
        </Button>
      </div>
    );
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <LogIn className="h-4 w-4" />
          Quick Register
        </CardTitle>
        <CardDescription className="text-xs">
          Register to reserve and purchase drops
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Input
          id="reg-username"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="h-9 text-sm"
        />
        <Input
          id="reg-email"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-9 text-sm"
          onKeyDown={(e) => e.key === "Enter" && register()}
        />
        <Button
          className="w-full"
          size="sm"
          onClick={() => register()}
          disabled={isPending || !username.trim() || !email.trim()}
        >
          {isPending ? "Registering…" : "Register"}
        </Button>
      </CardContent>
    </Card>
  );
}
