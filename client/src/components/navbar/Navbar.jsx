import React from "react";
import { Search, ShoppingCart, User } from "react-feather";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <div>
      <nav className="d-flex justify-content-between align-items-center p-3 position-fixed fixed-top" style={{ backgroundColor: "#0a192f" }}>
        <div className="navbar-brand text-white fw-bold fs-4">Druk Style</div>
        <div
          className="search-bar d-flex align-items-center bg-white p-1 rounded-3"
          style={{ flex: 1, maxWidth: "500px" }}
        >
          <input
            type="search"
            placeholder="Search for products, categories..."
            className="form-control border-0 shadow-none"
            style={{ flex: 1 }}
          />
          <Search className="text-muted me-3" size={18} />
        </div>
        <div className="d-flex align-items-center">
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
            <ShoppingCart className="text-white p-1" size={30} />
          </div>

          <div className="icon-container">
            <Link to="/login"><User className="text-white p-1" size={30} /></Link>
          </div>
        </div>
      </nav>

      {/* All Categories Section */}
      <div className="d-flex justify-content-between align-items-center position-relative px-3" style={{ paddingTop: "80px", backgroundColor: "#f1f3f5" }}>
        <strong className="d-flex align-items-center mb-0 text-dark">
          <span className="me-2">&#9776;</span> All Categories
        </strong>
        <div className="d-flex justify-content-start align-items-center">
          <div className="category-item d-flex align-items-center me-4 hover-effect">
            <span className="text-dark">Home</span>
          </div>
          <div className="category-item d-flex align-items-center me-4 hover-effect">
            <span className="text-dark">Contact</span>
          </div>
          <div className="category-item d-flex align-items-center me-4 hover-effect">
            <span className="text-dark">Today's Deal</span>
          </div>
          <div className="category-item d-flex align-items-center me-4 hover-effect">
            <span className="text-dark">About Us</span>
          </div>
          <div className="category-item d-flex align-items-center me-4 hover-effect">
            <span className="text-dark">Sell</span>
          </div>
          <div className="category-item d-flex align-items-center hover-effect">
            <span className="text-dark">Return an Order</span>
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
          transition: background-color 0.3s ease;
        }
        .icon-container:hover {
          background-color: rgba(255, 255, 255, 0.2);
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
          background-color: rgba(10, 25, 47, 0.1); /* Navy blue with 10% opacity */
          color: #0a192f; /* Navy blue color */
        }
      `}</style>
    </div>
  );
};

export default Navbar;