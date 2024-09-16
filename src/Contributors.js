import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Contributors = () => {
  const [contributors, setContributors] = useState([]);

  useEffect(() => {
    const fetchContributors = async () => {
      try {
        const internshipResponse = await axios.get('https://api.github.com/repos/tahiru0/internship/contributors');
        const serverResponse = await axios.get('https://api.github.com/repos/tahiru0/Server/contributors');
        
        const allContributors = [...internshipResponse.data, ...serverResponse.data];
        const uniqueContributors = Array.from(new Set(allContributors.map(c => c.id)))
          .map(id => allContributors.find(c => c.id === id));
        
        setContributors(uniqueContributors);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách người đóng góp:', error);
      }
    };

    fetchContributors();
  }, []);

  return (
    <div>
      <h2>Người đóng góp</h2>
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {contributors.map((contributor) => (
          <li key={contributor.id} style={{ textAlign: 'center' }}>
            <a href={contributor.html_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: '#333' }}>
              <img src={contributor.avatar_url} alt={contributor.login} width="50" height="50" style={{ borderRadius: '50%' }} />
              <div>{contributor.login}</div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Contributors;