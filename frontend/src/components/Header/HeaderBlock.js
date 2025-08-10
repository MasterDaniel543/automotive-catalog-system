import React from 'react';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import car1 from '../../assets/img/gtr-2.png';
import car2 from '../../assets/img/gtr.png';
import car3 from '../../assets/img/mustang.png';
import car4 from '../../assets/img/mustang2.png';
import car5 from '../../assets/img/w11.png';

function HeaderBlock() {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000
  };

  return (
    <div className="header-block">
      <div className="text">
        <h2>¡El vehículo perfecto para ti!</h2>
        <p>El camino hacia experiencias inolvidables comienza con inspiración</p>
      </div>
      <div className="carousel-container">
        <Slider {...settings}>
          <div>
            <img src={car1} alt="Car 1" />
          </div>
          <div>
            <img src={car2} alt="Car 2" />
          </div>
          <div>
            <img src={car3} alt="Car 3" />
          </div>
          <div>
            <img src={car4} alt="Car 4" />
          </div>
          <div>
            <img src={car5} alt="Car 5" />
          </div>
        </Slider>
      </div>
    </div>
  );
}

export default HeaderBlock;