import { useParams } from 'react-router-dom';
import ContestView from '../components/ContestView';

function ContestPage() {
  const { contestId } = useParams();
  return <ContestView contestId={contestId} />;
}

export default ContestPage;