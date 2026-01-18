import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  className,
}) => {
  const variants = {
    default: "bg-gray-100 text-gray-800 border-gray-200",
    success: "bg-green-100 text-green-800 border-green-200",
    warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
    danger: "bg-red-100 text-red-800 border-red-200",
    info: "bg-blue-100 text-blue-800 border-blue-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
};

// Status badge with automatic color coding
interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const getVariant = (status: string): "default" | "success" | "warning" | "danger" | "info" => {
    const statusLower = status.toLowerCase();

    if (statusLower.includes("completed") || statusLower.includes("active") || statusLower.includes("paid")) {
      return "success";
    }
    if (statusLower.includes("pending") || statusLower.includes("contacted") || statusLower.includes("shipped")) {
      return "warning";
    }
    if (statusLower.includes("cancelled") || statusLower.includes("failed")) {
      return "danger";
    }
    if (statusLower.includes("new")) {
      return "info";
    }

    return "default";
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <Badge variant={getVariant(status)} className={className}>
      {formatStatus(status)}
    </Badge>
  );
};
