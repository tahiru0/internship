import React from 'react';
import { useParams } from 'react-router-dom';

const InternshipDetails = () => {
  const { id } = useParams();

  return (
    <div>
      <h1>Chi tiết thực tập</h1>
      <p>ID thực tập: {id}</p>
      {/* Chi tiết về cơ hội thực tập sẽ được hiển thị ở đây */}
    </div>
  );
};

export default InternshipDetails;