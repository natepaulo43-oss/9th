import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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
      
      const response = await fetch(`${API_BASE_URL}/orders?${params}`, {
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

      const response = await fetch(`${API_BASE_URL}/orders/stats`, {
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

      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/submit-to-apliiq`, {
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

      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/fulfill`, {
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
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: Arial, sans-serif;
`;

const Header = styled.div`
  margin-bottom: 40px;
`;

const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const LogoutButton = styled.button`
  padding: 10px 20px;
  background: #ff6b6b;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #ff5252;
  }
`;

const ErrorBanner = styled.div`
  padding: 12px 16px;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 6px;
  color: #c33;
  font-size: 14px;
  margin-top: 12px;
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: bold;
  margin: 0 0 8px 0;
  color: #000;
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: #666;
  margin: 0;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
`;

const StatCard = styled.div<{ color?: string }>`
  background: ${(props) => props.color || '#f8f9fa'};
  padding: 24px;
  border-radius: 8px;
  text-align: center;
  ${(props) => props.color && 'color: white;'}
`;

const StatLabel = styled.div`
  font-size: 14px;
  margin-bottom: 8px;
  opacity: 0.9;
`;

const StatValue = styled.div`
  font-size: 36px;
  font-weight: bold;
`;

const FilterBar = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const FilterButton = styled.button<{ active: boolean }>`
  padding: 10px 20px;
  border: 2px solid ${(props) => (props.active ? '#000' : '#ddd')};
  background: ${(props) => (props.active ? '#000' : '#fff')};
  color: ${(props) => (props.active ? '#fff' : '#000')};
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;

  &:hover {
    border-color: #000;
  }
`;

const OrdersTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  th {
    background: #f8f9fa;
    padding: 16px;
    text-align: left;
    font-weight: 600;
    font-size: 14px;
    color: #495057;
    border-bottom: 2px solid #dee2e6;
  }

  td {
    padding: 16px;
    border-bottom: 1px solid #dee2e6;
    font-size: 14px;
  }

  tr:last-child td {
    border-bottom: none;
  }

  tr:hover {
    background: #f8f9fa;
  }
`;

const StatusBadge = styled.span<{ color: string }>`
  display: inline-block;
  padding: 4px 12px;
  background: ${(props) => props.color};
  color: white;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const Button = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
  }
`;

const ViewButton = styled(Button)`
  background: #868e96;
  color: white;
`;

const SubmitButton = styled(Button)`
  background: #ffa500;
  color: white;
`;

const FulfillButton = styled(Button)`
  background: #51cf66;
  color: white;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 60px;
  font-size: 18px;
  color: #666;
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 60px;
  font-size: 18px;
  color: #666;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #dee2e6;

  h2 {
    margin: 0;
    font-size: 24px;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 32px;
  cursor: pointer;
  color: #868e96;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;

  &:hover {
    color: #000;
  }
`;

const ModalBody = styled.div`
  padding: 24px;
`;

const Section = styled.div`
  margin-bottom: 32px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #000;
`;

const InfoRow = styled.div`
  display: flex;
  margin-bottom: 12px;
  align-items: flex-start;
`;

const Label = styled.div`
  font-weight: 600;
  min-width: 140px;
  color: #495057;
  font-size: 14px;
`;

const Value = styled.div`
  flex: 1;
  color: #212529;
  font-size: 14px;
`;

const ApliqButton = styled.button`
  width: 100%;
  padding: 16px;
  background: #ffa500;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 12px;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }
`;

const HelpText = styled.p`
  font-size: 13px;
  color: #666;
  margin: 0;
  line-height: 1.5;
`;

export default AdminDashboard;
