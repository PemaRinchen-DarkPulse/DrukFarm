import React from "react";
import { Search, ShoppingCart, User } from "react-feather";

const Navbar = () => {
  return (
    <div>
      <nav className="navbar navbar-expand-lg bg-light d-flex justify-content-between align-items-center bg-secondary">
        <div className="navbar-brand text-primary fw-bold fs-4">Druk Style</div>
        <div
          className="search-bar mx-auto d-flex align-items-center bg-white rounded shadow-sm"
          style={{ flex: 1, maxWidth: "500px" }}
        >
          <input
            type="search"
            placeholder="Search for products, categories..."
            className="form-control border-0 shadow-none"
            style={{ flex: 1 }}
          />
          <Search className="text-muted ms-2" size={18} />
        </div>

        {/* Right Section */}
        <div className="d-flex align-items-center">
          {/* Language Dropdown */}
          <div className="dropdown me-4">
            <button
              className="btn btn-light dropdown-toggle d-flex align-items-center border shadow-sm"
              type="button"
              id="languageDropdown"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              style={{ padding: "6px 12px" }}
            >
            ENG
            </button>
            <ul className="dropdown-menu shadow" aria-labelledby="languageDropdown">
              <li>
                <a className="dropdown-item d-flex align-items-center" href="#">
                 Dzo
                </a>
              </li>
              <li>
                <a className="dropdown-item d-flex align-items-center" href="#">
                ENG
                </a>
              </li>
              <li>
                <a className="dropdown-item d-flex align-items-center" href="#">
                FRA
                </a>
              </li>
            </ul>
          </div>

          <div className="icon-container me-2">
            <ShoppingCart className="text-dark p-1" size={30} />
          </div>

          <div className="icon-container">
            <User className="text-dark p-1" size={30} />
          </div>
        </div>
      </nav>

      {/* All Categories Section */}
      <div className="bg-dark text-white d-flex justify-content-between align-items-center">
        <strong className="d-flex align-items-center mb-0">
          <span className="me-2">&#9776;</span> All Categories
        </strong>
        <div className="d-flex justify-content-start align-items-center">
          <div className="category-item d-flex align-items-center me-4 hover-effect">
            <span>Home</span>
          </div>
          <div className="category-item d-flex align-items-center me-4 hover-effect">
            <span>Contact</span>
          </div>
          <div className="category-item d-flex align-items-center me-4 hover-effect">
            <span>Today's Deal</span>
          </div>
          <div className="category-item d-flex align-items-center me-4 hover-effect">
            <span>About Us</span>
          </div>
          <div className="category-item d-flex align-items-center me-4 hover-effect">
            <span>Sell</span>
          </div>
          <div className="category-item d-flex align-items-center hover-effect">
            <span>Return an Order</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .icon-container {
          width: 40px;
          height: 40px;
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 50%;
          cursor: pointer;
        }
        .icon-container:hover {
          background-color: rgba(0, 123, 255, 0.2);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .search-bar input:focus {
          outline: none;
        }
        .hover-effect {
          cursor: pointer;
          transition: background-color 0.3s ease, color 0.3s ease;
          padding: 8px;
          border-radius: 8px;
        }
        .hover-effect:hover {
          background-color: rgba(0, 123, 255, 0.1);
          color: #007bff;
        }

        .bg-dark {
          background-color: #343a40 !important;
        }
        .text-white {
          color: white !important;
        }
        .category-item {
          display: flex;
          align-items: center;
        }
        .category-item span {
          font-size: 16px;
        }
      `}</style>
    </div>
  );
};

export default Navbar;
