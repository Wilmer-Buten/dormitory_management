function CopyrightText({ className = "text-gray-500" }: { className?: string }) {
  return (
    <div className={`text-center text-sm ${className}`}>
      <p className="font-medium text-slate-500">DormControl</p>
      <p>© {new Date().getFullYear()} Wilmer Buten</p>
      <p className="text-xs opacity-80">All rights reserved</p>
    </div>
  );
}

export default CopyrightText;
