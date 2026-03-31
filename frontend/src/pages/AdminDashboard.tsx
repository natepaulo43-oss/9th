import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const resolveApiBaseUrl = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  if (window.location.hostname === 'localhost') {
    return process.env.REACT_APP_API_URL || 'http://localhost:5000';
  }

  // Production traffic stays same-origin and is proxied via Netlify redirects.
  return '';
};

const buildApiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const base = resolveApiBaseUrl();
  return base ? `${base}${normalizedPath}` : normalizedPath;
};

interface Order {
  id: string;
  stripeSessionId: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  shippingName: string;
  amountTotal: number;
  currency: string;
  items: Array<{ productId: string; quantity: number }>;
  status: string;
  apliqStatus: string;
  createdAt: Date | null;
  apliqOrderId?: string;
  trackingNumber?: string;
}

interface OrderStats {
  total: number;
  pending: number;
  submitted: number;
  fulfilled: number;
  notSubmitted: number;
}

const AdminDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'not_submitted' | 'submitted' | 'fulfilled'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();

  const getAuthToken = useCallback(async (): Promise<string | null> => {
    try {
      if (!auth) {
        setAuthError('Firebase authentication is not configured');
        return null;
      }
      const user = auth.currentUser;
      if (!user) {
        setAuthError('Not authenticated');
        navigate('/admin/login');
        return null;
      }
      return await user.getIdToken();
    } catch (error) {
      console.error('Error getting auth token:', error);
      setAuthError('Authentication error');
      return null;
    }
  }, [navigate]);

  const handleLogout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setAuthError(null);
      const token = await getAuthToken();
      if (!token) return;

      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('apliqStatus', filter);
      }
      
      const response = await fetch(buildApiUrl(`/orders?${params}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        setAuthError('Session expired. Please login again.');
        navigate('/admin/login');
        return;
      }

      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, navigate, getAuthToken]);

  const fetchStats = useCallback(async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch(buildApiUrl('/orders/stats'), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        setAuthError('Session expired. Please login again.');
        navigate('/admin/login');
        return;
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [navigate, getAuthToken]);

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [fetchOrders, fetchStats]);

  const markAsSubmitted = async (orderId: string, apliqOrderId?: string) => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch(buildApiUrl(`/orders/${orderId}/submit-to-apliiq`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ apliqOrderId }),
      });

      if (response.status === 401) {
        setAuthError('Session expired. Please login again.');
        navigate('/admin/login');
        return;
      }

      fetchOrders();
      fetchStats();
      alert('Order marked as submitted to Apliiq!');
    } catch (error) {
      console.error('Error marking order as submitted:', error);
      alert('Failed to mark order as submitted');
    }
  };

  const markAsFulfilled = async (orderId: string, trackingNumber?: string) => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch(buildApiUrl(`/orders/${orderId}/fulfill`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ trackingNumber }),
      });

      if (response.status === 401) {
        setAuthError('Session expired. Please login again.');
        navigate('/admin/login');
        return;
      }

      fetchOrders();
      fetchStats();
      alert('Order marked as fulfilled!');
    } catch (error) {
      console.error('Error marking order as fulfilled:', error);
      alert('Failed to mark order as fulfilled');
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatAddress = (address: Order['shippingAddress']) => {
    const parts = [
      address.line1,
      address.line2,
      address.city,
      address.state,
      address.postal_code,
      address.country,
    ].filter(Boolean);
    return parts.join(', ');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_submitted':
        return '#ff6b6b';
      case 'submitted':
        return '#ffa500';
      case 'fulfilled':
        return '#51cf66';
      default:
        return '#868e96';
    }
  };

  const openApliqCustomStore = () => {
    window.open('https://www.apliiq.com/verified/stores', '_blank');
  };

  return (
    <Container>
      <Header>
        <HeaderTop>
          <div>
            <Title>Order Management Dashboard</Title>
            <Subtitle>Apliiq Fulfillment Integration</Subtitle>
          </div>
          <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
        </HeaderTop>
        {authError && <ErrorBanner>{authError}</ErrorBanner>}
      </Header>

      {stats && (
        <StatsGrid>
          <StatCard>
            <StatLabel>Total Orders</StatLabel>
            <StatValue>{stats.total}</StatValue>
          </StatCard>
          <StatCard color="#ff6b6b">
            <StatLabel>Needs Submission</StatLabel>
            <StatValue>{stats.notSubmitted}</StatValue>
          </StatCard>
          <StatCard color="#ffa500">
            <StatLabel>Submitted to Apliiq</StatLabel>
            <StatValue>{stats.submitted}</StatValue>
          </StatCard>
          <StatCard color="#51cf66">
            <StatLabel>Fulfilled</StatLabel>
            <StatValue>{stats.fulfilled}</StatValue>
          </StatCard>
        </StatsGrid>
      )}

      <FilterBar>
        <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
          All Orders
        </FilterButton>
        <FilterButton active={filter === 'not_submitted'} onClick={() => setFilter('not_submitted')}>
          Needs Submission
        </FilterButton>
        <FilterButton active={filter === 'submitted'} onClick={() => setFilter('submitted')}>
          Submitted
        </FilterButton>
        <FilterButton active={filter === 'fulfilled'} onClick={() => setFilter('fulfilled')}>
          Fulfilled
        </FilterButton>
      </FilterBar>

      {loading ? (
        <LoadingMessage>Loading orders...</LoadingMessage>
      ) : orders.length === 0 ? (
        <EmptyMessage>No orders found</EmptyMessage>
      ) : (
        <OrdersTable>
          <thead>
            <tr>
              <th>Order Date</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</td>
                <td>
                  <strong>{order.customerName}</strong>
                  <br />
                  <small>{order.customerEmail}</small>
                </td>
                <td>{order.items.length} item(s)</td>
                <td>{formatCurrency(order.amountTotal, order.currency)}</td>
                <td>
                  <StatusBadge color={getStatusColor(order.apliqStatus)}>
                    {order.apliqStatus.replace('_', ' ').toUpperCase()}
                  </StatusBadge>
                </td>
                <td>
                  <ActionButtons>
                    <ViewButton onClick={() => setSelectedOrder(order)}>View Details</ViewButton>
                    {order.apliqStatus === 'not_submitted' && (
                      <SubmitButton onClick={() => markAsSubmitted(order.id)}>
                        Mark as Submitted
                      </SubmitButton>
                    )}
                    {order.apliqStatus === 'submitted' && (
                      <FulfillButton onClick={() => markAsFulfilled(order.id)}>
                        Mark as Fulfilled
                      </FulfillButton>
                    )}
                  </ActionButtons>
                </td>
              </tr>
            ))}
          </tbody>
        </OrdersTable>
      )}

      {selectedOrder && (
        <Modal onClick={() => setSelectedOrder(null)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h2>Order Details</h2>
              <CloseButton onClick={() => setSelectedOrder(null)}>×</CloseButton>
            </ModalHeader>
            <ModalBody>
              <Section>
                <SectionTitle>Customer Information</SectionTitle>
                <InfoRow>
                  <Label>Name:</Label>
                  <Value>{selectedOrder.customerName}</Value>
                </InfoRow>
                <InfoRow>
                  <Label>Email:</Label>
                  <Value>{selectedOrder.customerEmail}</Value>
                </InfoRow>
                <InfoRow>
                  <Label>Phone:</Label>
                  <Value>{selectedOrder.customerPhone || 'N/A'}</Value>
                </InfoRow>
              </Section>

              <Section>
                <SectionTitle>Shipping Address</SectionTitle>
                <InfoRow>
                  <Label>Ship To:</Label>
                  <Value>{selectedOrder.shippingName}</Value>
                </InfoRow>
                <InfoRow>
                  <Label>Address:</Label>
                  <Value>{formatAddress(selectedOrder.shippingAddress)}</Value>
                </InfoRow>
              </Section>

              <Section>
                <SectionTitle>Order Items</SectionTitle>
                {selectedOrder.items.map((item, index) => (
                  <InfoRow key={index}>
                    <Label>Product ID:</Label>
                    <Value>
                      {item.productId} (Qty: {item.quantity})
                    </Value>
                  </InfoRow>
                ))}
              </Section>

              <Section>
                <SectionTitle>Order Status</SectionTitle>
                <InfoRow>
                  <Label>Payment Status:</Label>
                  <Value>{selectedOrder.status}</Value>
                </InfoRow>
                <InfoRow>
                  <Label>Apliiq Status:</Label>
                  <Value>
                    <StatusBadge color={getStatusColor(selectedOrder.apliqStatus)}>
                      {selectedOrder.apliqStatus.replace('_', ' ').toUpperCase()}
                    </StatusBadge>
                  </Value>
                </InfoRow>
                {selectedOrder.apliqOrderId && (
                  <InfoRow>
                    <Label>Apliiq Order ID:</Label>
                    <Value>{selectedOrder.apliqOrderId}</Value>
                  </InfoRow>
                )}
                {selectedOrder.trackingNumber && (
                  <InfoRow>
                    <Label>Tracking Number:</Label>
                    <Value>{selectedOrder.trackingNumber}</Value>
                  </InfoRow>
                )}
              </Section>

              <Section>
                <SectionTitle>Fulfillment Actions</SectionTitle>
                <ApliqButton onClick={openApliqCustomStore}>
                  Open Apliiq Custom Store →
                </ApliqButton>
                <HelpText>
                  Copy the customer and shipping information above, then manually submit this order in
                  your Apliiq custom store portal.
                </HelpText>
              </Section>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

const Container = styled.div`
  min-height: 100vh;
  background: radial-gradient(circle at top, rgba(255, 255, 255, 0.08), transparent 50%),
    linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%);
  padding: 120px 20px 40px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"%3E%3Crect width="120" height="120" fill="%23000000"/%3E%3Cpath d="M0 0h1v1H0z" fill="%23ffffff" opacity="0.03"/%3E%3C/svg%3E');
    opacity: 0.4;
    pointer-events: none;
  }
`;

const Header = styled.div`
  max-width: 1400px;
  margin: 0 auto 40px;
  position: relative;
  z-index: 1;
`;

const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(25px);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.07), transparent 60%);
    opacity: 0.8;
    pointer-events: none;
  }
  
  & > * {
    position: relative;
    z-index: 1;
  }
`;

const LogoutButton = styled.button`
  padding: 10px 20px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #ffffff;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.6);
  }
`;

const ErrorBanner = styled.div`
  padding: 12px 16px;
  background: rgba(248, 113, 113, 0.1);
  border: 1px solid rgba(248, 113, 113, 0.3);
  color: #f87171;
  font-size: 14px;
  margin-top: 12px;
`;

const Title = styled.h1`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin: 0 0 8px 0;
  color: #ffffff;
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: #888888;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin: 0;
`;

const StatsGrid = styled.div`
  max-width: 1400px;
  margin: 0 auto 40px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  position: relative;
  z-index: 1;
`;

const StatCard = styled.div<{ color?: string }>`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(25px);
  padding: 24px;
  text-align: center;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: ${(props) => props.color ? `linear-gradient(135deg, ${props.color}33, transparent 60%)` : 'linear-gradient(135deg, rgba(255, 255, 255, 0.07), transparent 60%)'};
    opacity: 0.8;
    pointer-events: none;
  }
  
  & > * {
    position: relative;
    z-index: 1;
  }
`;

const StatLabel = styled.div`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 14px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: 8px;
  color: #888888;
`;

const StatValue = styled.div`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 36px;
  font-weight: 700;
  color: #ffffff;
`;

const FilterBar = styled.div`
  max-width: 1400px;
  margin: 0 auto 24px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
`;

const FilterButton = styled.button<{ active: boolean }>`
  padding: 10px 20px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border: 1px solid ${(props) => (props.active ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.2)')};
  background: ${(props) => (props.active ? 'rgba(255, 255, 255, 0.1)' : 'transparent')};
  color: #ffffff;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(255, 255, 255, 0.6);
    background: rgba(255, 255, 255, 0.1);
  }
`;

const OrdersTable = styled.table`
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  border-collapse: collapse;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(25px);
  overflow: hidden;
  position: relative;
  z-index: 1;

  th {
    font-family: 'Space Grotesk', sans-serif;
    background: rgba(255, 255, 255, 0.02);
    padding: 16px;
    text-align: left;
    font-weight: 600;
    font-size: 14px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: #888888;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  td {
    padding: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    font-size: 14px;
    color: #ffffff;
  }
  
  td small {
    color: #888888;
  }

  tr:last-child td {
    border-bottom: none;
  }

  tbody tr:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const StatusBadge = styled.span<{ color: string }>`
  display: inline-block;
  padding: 4px 12px;
  background: ${(props) => `${props.color}33`};
  border: 1px solid ${(props) => `${props.color}66`};
  color: ${(props) => props.color};
  font-family: 'Space Grotesk', sans-serif;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const Button = styled.button`
  padding: 8px 16px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border: 1px solid rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.6);
  }
`;

const ViewButton = styled(Button)`
  background: transparent;
  color: #ffffff;
`;

const SubmitButton = styled(Button)`
  background: rgba(255, 165, 0, 0.2);
  border-color: #ffa500;
  color: #ffa500;
  
  &:hover {
    background: rgba(255, 165, 0, 0.3);
    border-color: #ffa500;
  }
`;

const FulfillButton = styled(Button)`
  background: rgba(81, 207, 102, 0.2);
  border-color: #51cf66;
  color: #51cf66;
  
  &:hover {
    background: rgba(81, 207, 102, 0.3);
    border-color: #51cf66;
  }
`;

const LoadingMessage = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  text-align: center;
  padding: 60px;
  font-size: 18px;
  color: #888888;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  position: relative;
  z-index: 1;
`;

const EmptyMessage = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  text-align: center;
  padding: 60px;
  font-size: 18px;
  color: #888888;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  position: relative;
  z-index: 1;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: rgba(10, 10, 10, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(25px);
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), transparent 60%);
    opacity: 0.8;
    pointer-events: none;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  z-index: 1;

  h2 {
    font-family: 'Space Grotesk', sans-serif;
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #ffffff;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 32px;
  cursor: pointer;
  color: #888888;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
  transition: color 0.3s ease;

  &:hover {
    color: #ffffff;
  }
`;

const ModalBody = styled.div`
  padding: 24px;
  position: relative;
  z-index: 1;
`;

const Section = styled.div`
  margin-bottom: 32px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin: 0 0 16px 0;
  color: #ffffff;
`;

const InfoRow = styled.div`
  display: flex;
  margin-bottom: 12px;
  align-items: flex-start;
`;

const Label = styled.div`
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 600;
  min-width: 140px;
  color: #888888;
  font-size: 14px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

const Value = styled.div`
  flex: 1;
  color: #ffffff;
  font-size: 14px;
`;

const ApliqButton = styled.button`
  width: 100%;
  padding: 16px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  background: rgba(255, 165, 0, 0.2);
  border: 1px solid #ffa500;
  color: #ffa500;
  cursor: pointer;
  margin-bottom: 12px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 165, 0, 0.3);
    border-color: #ffa500;
  }
`;

const HelpText = styled.p`
  font-size: 13px;
  color: #888888;
  margin: 0;
  line-height: 1.5;
`;

export default AdminDashboard;
