/* Carousel specific styles */
.carousel {
  display: flex;
  width: 100%;
  overflow: hidden;
  position: relative;
}

.carousel-item {
  min-width: 100%;
  transition: transform 0.5s ease;
}

.carousel img {
  width: 100%;
  height: auto;
  object-fit: cover;
}

/* Navigation buttons for the carousel */
.carousel-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  padding: 10px;
  cursor: pointer;
}

.carousel-btn.prev {
  left: 10px;
}

.carousel-btn.next {
  right: 10px;
}

/* Recipe card styles */
.recipe-card {
  background: var(--card);
  border: 1px solid var(--line);
  padding: 16px;
  margin: 16px 0;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.recipe-card img {
  max-height: 200px;
  object-fit: cover;
  border-radius: 8px;
}

.recipe-card h4 {
  margin: 12px 0;
  font-size: 1.2rem;
}

.recipe-card p {
  margin: 4px 0;
  font-size: 1rem;
}

#recipeSearch input {
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid var(--line);
  font-size: 16px;
}
