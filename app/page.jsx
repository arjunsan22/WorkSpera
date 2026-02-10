import Feeds from "@/app/(user)/feeds/page";
import Home from "@/app/components/user/home";

export default function Page() {
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <Feeds />
    </div>
  );
}