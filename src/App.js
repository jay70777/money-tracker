import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, Briefcase, Plus, Edit2, Trash2, Save, X } from 'lucide-react';

const App = () => {
  const [activeTab, setActiveTab] = useState('budget');
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  
  // Budget state
  const [transactions, setTransactions] = useState([]);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  
  // Job tracker state
  const [jobs, setJobs] = useState([]);
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  // Load data from storage
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        const transactionsResult = await window.storage.get(`transactions_${user.id}`);
        if (transactionsResult) {
          setTransactions(JSON.parse(transactionsResult.value));
        }
        
        const jobsResult = await window.storage.get(`jobs_${user.id}`);
        if (jobsResult) {
          setJobs(JSON.parse(jobsResult.value));
        }
      } catch (error) {
        console.log('No existing data found');
      }
    };
    
    loadData();
  }, [user]);

  // Save transactions to storage
  const saveTransactions = async (newTransactions) => {
    setTransactions(newTransactions);
    if (user) {
      await window.storage.set(`transactions_${user.id}`, JSON.stringify(newTransactions));
    }
  };

  // Save jobs to storage
  const saveJobs = async (newJobs) => {
    setJobs(newJobs);
    if (user) {
      await window.storage.set(`jobs_${user.id}`, JSON.stringify(newJobs));
    }
  };

  // Auth functions
  const handleAuth = async () => {
    if (!authEmail || !authPassword) {
      alert('Please fill in all fields');
      return;
    }
    
    if (authMode === 'signup') {
      const userId = Date.now().toString();
      const newUser = { id: userId, email: authEmail };
      setUser(newUser);
      await window.storage.set(`user_${authEmail}`, JSON.stringify({ ...newUser, password: authPassword }));
    } else {
      try {
        const result = await window.storage.get(`user_${authEmail}`);
        if (result) {
          const userData = JSON.parse(result.value);
          if (userData.password === authPassword) {
            setUser({ id: userData.id, email: userData.email });
          } else {
            alert('Invalid password');
            return;
          }
        } else {
          alert('User not found');
          return;
        }
      } catch (error) {
        alert('User not found');
        return;
      }
    }
    
    setAuthEmail('');
    setAuthPassword('');
  };

  const handleLogout = () => {
    setUser(null);
    setTransactions([]);
    setJobs([]);
  };

  // Transaction functions
  const addTransaction = async (transaction) => {
    const newTransaction = { ...transaction, id: Date.now().toString() };
    await saveTransactions([...transactions, newTransaction]);
    setShowTransactionForm(false);
  };

  const updateTransaction = async (transaction) => {
    const updated = transactions.map(t => t.id === transaction.id ? transaction : t);
    await saveTransactions(updated);
    setEditingTransaction(null);
  };

  const deleteTransaction = async (id) => {
    await saveTransactions(transactions.filter(t => t.id !== id));
  };

  // Job functions
  const addJob = async (job) => {
    const newJob = { ...job, id: Date.now().toString() };
    await saveJobs([...jobs, newJob]);
    setShowJobForm(false);
  };

  const updateJob = async (job) => {
    const updated = jobs.map(j => j.id === job.id ? job : j);
    await saveJobs(updated);
    setEditingJob(null);
  };

  const deleteJob = async (id) => {
    await saveJobs(jobs.filter(j => j.id !== id));
  };

  // Calculate budget stats
  const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const balance = income - expenses;

  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount);
      return acc;
    }, {});

  const categoryData = Object.entries(expensesByCategory).map(([name, value]) => ({ name, value }));
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  // Filter jobs
  const filteredJobs = filterStatus === 'all' ? jobs : jobs.filter(j => j.status === filterStatus);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Career & Finance Dashboard</h1>
          <p className="text-gray-600 mb-6 text-center">Track your budget and job applications in one place</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
            
            <button
              onClick={handleAuth}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
              {authMode === 'login' ? 'Login' : 'Sign Up'}
            </button>
          </div>
          
          <button
            onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
            className="w-full mt-4 text-blue-600 hover:underline text-sm"
          >
            {authMode === 'login' ? 'Need an account? Sign up' : 'Have an account? Login'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Career & Finance Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user.email}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('budget')}
            className={`px-6 py-3 font-medium transition flex items-center gap-2 ${
              activeTab === 'budget'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <DollarSign size={20} />
            Budget Tracker
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-6 py-3 font-medium transition flex items-center gap-2 ${
              activeTab === 'jobs'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Briefcase size={20} />
            Job Applications
          </button>
        </div>
      </div>

      {/* Budget Tracker Content */}
      {activeTab === 'budget' && (
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-600 text-sm font-medium">Total Income</h3>
              <p className="text-3xl font-bold text-green-600">${income.toFixed(2)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-600 text-sm font-medium">Total Expenses</h3>
              <p className="text-3xl font-bold text-red-600">${expenses.toFixed(2)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-600 text-sm font-medium">Balance</h3>
              <p className={`text-3xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                ${balance.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Charts */}
          {categoryData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Expenses by Category</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Transactions */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Transactions</h2>
              <button
                onClick={() => setShowTransactionForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus size={20} />
                Add Transaction
              </button>
            </div>

            {showTransactionForm && (
              <TransactionForm
                onSubmit={addTransaction}
                onCancel={() => setShowTransactionForm(false)}
              />
            )}

            <div className="divide-y">
              {transactions.length === 0 ? (
                <p className="p-6 text-gray-500 text-center">No transactions yet. Add your first one!</p>
              ) : (
                transactions.map(transaction => (
                  <div key={transaction.id}>
                    {editingTransaction?.id === transaction.id ? (
                      <TransactionForm
                        transaction={editingTransaction}
                        onSubmit={updateTransaction}
                        onCancel={() => setEditingTransaction(null)}
                      />
                    ) : (
                      <div className="p-4 flex justify-between items-center hover:bg-gray-50">
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-gray-600">
                            {transaction.category} • {transaction.date}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`text-lg font-semibold ${
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}${parseFloat(transaction.amount).toFixed(2)}
                          </span>
                          <button
                            onClick={() => setEditingTransaction(transaction)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => deleteTransaction(transaction.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Job Tracker Content */}
      {activeTab === 'jobs' && (
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {/* Job Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <p className="text-2xl font-bold text-blue-600">{jobs.length}</p>
              <p className="text-sm text-gray-600">Total Applications</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {jobs.filter(j => j.status === 'applied').length}
              </p>
              <p className="text-sm text-gray-600">Applied</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <p className="text-2xl font-bold text-purple-600">
                {jobs.filter(j => j.status === 'interviewing').length}
              </p>
              <p className="text-sm text-gray-600">Interviewing</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <p className="text-2xl font-bold text-green-600">
                {jobs.filter(j => j.status === 'offer').length}
              </p>
              <p className="text-sm text-gray-600">Offers</p>
            </div>
          </div>

          {/* Jobs List */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Job Applications</h2>
                <button
                  onClick={() => setShowJobForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Plus size={20} />
                  Add Application
                </button>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                {['all', 'applied', 'interviewing', 'offer', 'rejected'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-2 rounded-lg transition ${
                      filterStatus === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {showJobForm && (
              <JobForm
                onSubmit={addJob}
                onCancel={() => setShowJobForm(false)}
              />
            )}

            <div className="divide-y">
              {filteredJobs.length === 0 ? (
                <p className="p-6 text-gray-500 text-center">
                  {filterStatus === 'all' 
                    ? 'No job applications yet. Add your first one!' 
                    : `No ${filterStatus} applications.`}
                </p>
              ) : (
                filteredJobs.map(job => (
                  <div key={job.id}>
                    {editingJob?.id === job.id ? (
                      <JobForm
                        job={editingJob}
                        onSubmit={updateJob}
                        onCancel={() => setEditingJob(null)}
                      />
                    ) : (
                      <div className="p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{job.position}</h3>
                            <p className="text-gray-600">{job.company}</p>
                            <p className="text-sm text-gray-500 mt-1">Applied: {job.dateApplied}</p>
                            {job.notes && (
                              <p className="text-sm text-gray-600 mt-2">{job.notes}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              job.status === 'applied' ? 'bg-yellow-100 text-yellow-800' :
                              job.status === 'interviewing' ? 'bg-purple-100 text-purple-800' :
                              job.status === 'offer' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                            </span>
                            <button
                              onClick={() => setEditingJob(job)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => deleteJob(job.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Transaction Form Component
const TransactionForm = ({ transaction, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(transaction || {
    type: 'expense',
    amount: '',
    category: 'Food',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = () => {
    if (!formData.amount || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="p-4 bg-gray-50 border-b">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({...formData, type: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
          <input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="Food">Food</option>
            <option value="Transportation">Transportation</option>
            <option value="Housing">Housing</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Utilities">Utilities</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Salary">Salary</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="What was this for?"
          />
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={handleSubmit}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Save size={18} />
          Save
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
        >
          <X size={18} />
          Cancel
        </button>
      </div>
    </div>
  );
};

// Job Form Component
const JobForm = ({ job, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(job || {
    company: '',
    position: '',
    status: 'applied',
    dateApplied: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const handleSubmit = () => {
    if (!formData.company || !formData.position) {
      alert('Please fill in company and position');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="p-4 bg-gray-50 border-b">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
          <input
            type="text"
            value={formData.company}
            onChange={(e) => setFormData({...formData, company: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Company name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
          <input
            type="text"
            value={formData.position}
            onChange={(e) => setFormData({...formData, position: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Job title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="applied">Applied</option>
            <option value="interviewing">Interviewing</option>
            <option value="offer">Offer</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date Applied</label>
          <input
            type="date"
            value={formData.dateApplied}
            onChange={(e) => setFormData({...formData, dateApplied: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Interview dates, contact info, follow-up tasks..."
            rows="3"
          />
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={handleSubmit}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Save size={18} />
          Save
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
        >
          <X size={18} />
          Cancel
        </button>
      </div>
    </div>
  );
};

export default App;
