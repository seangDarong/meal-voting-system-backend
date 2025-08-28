import User from "@/models/user"

declare global {
  namespace Express {
    interface User extends InstanceType<typeof User> {}
  }
}