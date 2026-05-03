import React from "react";
import Navbar from "../components/common/Navbar";

const AdminBooks = () => (
  <>
    <Navbar />
    <div className="min-h-screen flex items-center justify-center bg-library-paper dark:bg-[#060e18] pt-[calc(8rem+env(safe-area-inset-top,0px))] px-4">
      <p className="text-library-primary dark:text-white font-bold">إدارة الكتب (Admin) — قيد البناء</p>
    </div>
  </>
);
export default AdminBooks;
