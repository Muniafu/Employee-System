import { useState, useEffect, useCallback } from 'react';
import { Banknote, ClipboardList, Zap } from 'lucide-react';
import { toast } from 'react-toastify';
import {
    getMyPayroll,
    getPayrolls,
    previewPayroll,
    generatePayroll,
} from "../../services/payrollService";
import { getEmployees } from '../../services/employeeService';
import { getPayrollPeriods } from '../../services/payrollService';
import { getError } from '../../services/api';
import { useAuth } from '../../context/useAuth';
import Modal from '../../components/Modal';
import Table from '../../components/Table';

const formatCurrency = (value) =>
  value != null
    ? `KES ${Number(value).toLocaleString()}`
    : '—';

const STATUS_BADGES = {
  draft: 'badge-warning',
  review: 'badge-info',
  approved: 'badge-primary',
  locked: 'badge-dark',
  paid: 'badge-success',
  rejected: 'badge-danger',
};

export default function PayrollDashboard() {
  const { isAdmin, isHR } = useAuth();
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [view, setView] = useState(
    isAdmin || isHR ? 'all' : 'mine'
  );
  const [myPayrolls, setMyPayrolls] = useState([]);
  const [allPayrolls, setAllPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [payrollPeriods, setPayrollPeriods] = useState([]);
  const [preview, setPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showFinalize, setShowFinalize] = useState(false);
  const [previewForm, setPreviewForm] = useState({
    employeeId: '',
    payrollPeriodId: '',
  });
  const [finalizeForm, setFinalizeForm] = useState({
    employeeId: '',
    payrollPeriodId: '',
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const my = await getMyPayroll();
      setMyPayrolls(my.data.data);
      if (isAdmin || isHR) {
        const [payrolls, employeesRes, periods] =
          await Promise.all([
            getPayrolls(),
            getEmployees(),
            getPayrollPeriods(),
          ]);
        setAllPayrolls(payrolls.data.data);
        setEmployees(employeesRes.data.data);
        setPayrollPeriods(periods.data.data);
      }
    } catch (error) {
      toast.error(getError(error));
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isHR]);
  useEffect(() => {
    load();
  }, [load]);

  const handlePreview = async (e) => {
    e.preventDefault();
    try {
      setActing(true);
      const { data } =
        await previewPayroll(previewForm);
      setPreview(data.data);
      setShowPreview(false);
    } catch (error) {
      toast.error(getError(error));
    } finally {
      setActing(false);
    }
  };

  const handleFinalize = async (e) => {
    e.preventDefault();
    try {
      setActing(true);
      await generatePayroll(finalizeForm);
      toast.success(
        'Payroll generated successfully.'
      );
      setShowFinalize(false);

      setFinalizeForm({
        employeeId: '',
        payrollPeriodId: '',
      });
      load();
    } catch (error) {
      toast.error(getError(error));
    } finally {
      setActing(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
            <h1 className="page-title" style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Banknote size={24} /> Payroll
          </h1>
          <p className="page-subtitle">{isAdmin || isHR ? 'Process and manage payroll' : 'Your payslips and compensation history'}</p>
        </div>
        {(isAdmin || isHR) && (
          <div style={{ display:'flex', gap:10 }}>
            <button className="btn btn-outline" onClick={() => setShowPreview(false) || setShowPreview(true) || setPreview(null) || setPreviewForm({ employeeId:'', payrollPeriodId: '' })}>
                <ClipboardList size={16} style={{ marginRight:6 }} /> Preview
            </button>
            <button className="btn btn-primary" onClick={() => setShowFinalize(true)}><Zap size={16}/> Finalize Payroll</button>
          </div>
        )}
      </div>

      {(isAdmin || isHR) && (
        <div className="tabs">
          <button className={`tab ${view==='all'?'active':''}`} onClick={() => setView('all')}>All Payroll</button>
          <button className={`tab ${view==='mine'?'active':''}`} onClick={() => setView('mine')}>My Payslips</button>
        </div>
      )}

      {/* ==========================================================
        MY PAYROLL
      ========================================================== */}
      {view === 'mine' && (
      <div className="card">
          <div className="card-header">
              <span className="card-title">
                  My Payroll History
              </span>
          </div>
          <Table
              loading={loading}
              data={myPayrolls}
              emptyMsg="No payroll records found."
              columns={[
                  {
                      label: 'Period',
                      render: (row) =>
                          row.payrollPeriod?.name ||
                          `${row.payrollPeriod?.month}/${row.payrollPeriod?.year}`,
                  },
                  {
                      label: 'Gross',
                      render: (row) =>
                          formatCurrency(
                              row.totals?.grossPay
                          ),
                  },
                  {
                      label: 'PAYE',
                      render: (row) =>
                          formatCurrency(
                              row.statutory?.paye
                          ),
                  },
                  {
                      label: 'NHIF',
                      render: (row) =>
                          formatCurrency(
                              row.statutory?.nhif
                          ),
                  },
                  {
                      label: 'NSSF',
                      render: (row) =>
                          formatCurrency(
                              row.statutory?.nssf
                          ),
                  },
                  {
                      label: 'Housing Levy',
                      render: (row) =>
                          formatCurrency(
                              row.statutory?.housingLevy
                          ),
                  },
                  {
                      label: 'Net Pay',
                      render: (row) => (
                          <strong style={{ color:'var(--success)' }}>
                              {formatCurrency(
                                  row.totals?.netPay
                              )}
                          </strong>
                      ),
                  },
                  {
                      label:'Status',
                      render:(row)=>(
                          <span
                              className={`badge ${STATUS_BADGES[row.workflow?.status] || 'badge-secondary'}`}
                          >
                              {row.workflow?.status}
                          </span>
                      ),
                  },
              ]}
          />
      </div>
      )}

      {/* ==========================================================
        ADMIN PAYROLL TABLE
      ========================================================== */}
      {view === 'all' && (isAdmin || isHR) && (
      <div className="card">
          <div className="card-header">
              <span className="card-title">
                  Payroll Records
              </span>
          </div>

          <Table
              loading={loading}
              data={allPayrolls}
              emptyMsg="No payroll records."
              columns={[
                  {
                      label:'Employee',
                      render:(row)=>(
                          <div>
                              <strong>
                                  {row.employeeSnapshot?.fullName}
                              </strong>
                              <div
                                  style={{
                                      fontSize:12,
                                      color:'var(--color-text-muted)',
                                  }}
                              >
                                  {row.employeeSnapshot?.employeeNumber}
                              </div>
                          </div>
                      ),
                  },
                  {
                      label:'Department',
                      render:(row)=>
                          row.employeeSnapshot?.department ||
                          'N/A',
                  },
                  {
                      label:'Period',
                      render:(row)=>
                          row.payrollPeriod?.name,
                  },
                  {
                      label:'Gross',
                      render:(row)=>
                          formatCurrency(
                              row.totals?.grossPay
                          ),
                  },
                  {
                      label:'Deductions',
                      render:(row)=>
                          formatCurrency(
                              row.totals?.totalDeductions
                          ),
                  },
                  {
                      label:'Net',
                      render:(row)=>
                          formatCurrency(
                              row.totals?.netPay
                          ),
                  },
                  {
                      label:'Status',
                      render:(row)=>(
                          <span
                              className={`badge ${STATUS_BADGES[row.workflow?.status]}`}
                          >
                              {row.workflow?.status}
                          </span>
                      ),
                  },
                  {
                      label:'Generated',
                      render:(row)=>
                          row.workflow?.generatedAt
                              ?
                              new Date(
                                  row.workflow.generatedAt
                              ).toLocaleDateString()
                              :
                              '-',
                  },
              ]}
          />
      </div>
      )}

      {/* ==========================================================
          PREVIEW PAYROLL
      ========================================================== */}
      <Modal
          open={showPreview}
          onClose={() => {
              setShowPreview(false);
              setPreview(null)

              setPreviewForm({
                employeeId: '',
                payrollPeriodId: '',
              });
          }}
          title="Preview Payroll"
      >
      <form onSubmit={handlePreview}>
          <div className="form-group">
              <label className="form-label">
                  Employee
              </label>
              <select
                  className="form-control form-select"
                  value={previewForm.employeeId}
                  onChange={(e)=>
                      setPreviewForm((prev)=>({
                          ...prev,
                          employeeId:e.target.value,
                      }))
                  }
                  required
              >

                  <option value="">
                      Select Employee
                  </option>
                  {employees.map(employee=>(
                      <option
                          key={employee._id}
                          value={employee._id}
                      >
                          {employee.user?.firstName}{" "}
                          {employee.user?.lastName}
                      </option>
                  ))}
              </select>
          </div>

          <div className="form-group">
              <label className="form-label">
                  Payroll Period
              </label>
              <select
                  className="form-control form-select"
                  value={previewForm.payrollPeriodId}
                  onChange={(e)=>
                      setPreviewForm((prev)=>({
                          ...prev,
                          payrollPeriodId:e.target.value,
                      }))
                  }
                  required
              >
                  <option value="">
                      Select Payroll Period
                  </option>
                  {payrollPeriods.map(period=>(
                      <option
                          key={period._id}
                          value={period._id}
                      >
                          {period.name}
                      </option>
                  ))}
              </select>
          </div>

          <div
              className="modal-footer"
              style={{
                  borderTop:"none",
                  padding:0,
                  marginTop:20,
              }}
          >
              <button
                  type="button"
                  className="btn btn-outline"
                  onClick={()=>setShowPreview(false)}
              >
                  Cancel
              </button>

              <button
                  className="btn btn-primary"
                  disabled={acting}
              >
                  {acting ? "Calculating..." : "Preview Payroll"}
              </button>
          </div>
      </form>
      </Modal>

      {/* ==========================================================
          PAYROLL PREVIEW RESULT
      ========================================================== */}

      {preview && (

      <Modal
          open={Boolean(preview)}
          onClose={()=>setPreview(null)}
          title="Payroll Preview"
      >

      <div className="card">
          <h3>
              {preview.employeeSnapshot?.fullName}
          </h3>

          <p>
              {preview.employeeSnapshot?.department}
          </p>

      </div>
      <hr/>
      
      <h4>Earnings</h4>
      
      <table className="table">
        <tbody>
          <tr>
            <td>Basic Salary</td>
            <td>
              {formatCurrency(
                preview.earnings?.basicSalary
              )}
            </td>
          </tr>
          <tr>
            <td>Allowances</td>
            <td>
              {formatCurrency(
                preview.earnings?.totalAllowances
              )}
            </td>
          </tr>
          <tr>
            <td>Overtime</td>
            <td>
              {formatCurrency(
                preview.earnings?.overtimePay
              )}
            </td>
          </tr>
          <tr>
            <td>Bonus</td>
            <td>
              {formatCurrency(
                preview.earnings?.bonus
              )}
            </td>
          </tr>
          <tr>
            <td>
              <strong>Gross Pay</strong>
            </td>
            <td>
              <strong>
                {formatCurrency(
                  preview.totals?.grossPay
                )}
              </strong>
            </td>
          </tr>
        </tbody>
      </table>

      <hr/>
      
      <h4>Statutory Deductions</h4>
      <table className="table">
        <tbody>
          <tr>

      <td>PAYE</td>

      <td>

      {formatCurrency(
      preview.statutory?.paye
      )}

      </td>

      </tr>

      <tr>

      <td>NHIF</td>

      <td>

      {formatCurrency(
      preview.statutory?.nhif
      )}

      </td>

      </tr>

      <tr>

      <td>NSSF</td>

      <td>

      {formatCurrency(
      preview.statutory?.nssf
      )}

      </td>

      </tr>

      <tr>

      <td>Housing Levy</td>

      <td>

      {formatCurrency(
      preview.statutory?.housingLevy
      )}

      </td>

      </tr>

      <tr>

      <td>

      Other Deductions

      </td>

      <td>

      {formatCurrency(
      preview.deductions?.totalOtherDeductions
      )}

      </td>

      </tr>

      <tr>

      <td>

      <strong>

      Total Deductions

      </strong>

      </td>

      <td>

      <strong>

      {formatCurrency(
      preview.totals?.totalDeductions
      )}

      </strong>

      </td>

      </tr>

      </tbody>

      </table>

      <hr/>

      <h4>Employer Contributions</h4>

      <table className="table">

      <tbody>

      <tr>

      <td>Employer NSSF</td>

      <td>

      {formatCurrency(
      preview.employerContributions?.employerNSSF
      )}

      </td>

      </tr>

      <tr>

      <td>Employer Housing Levy</td>

      <td>

      {formatCurrency(
      preview.employerContributions?.employerHousingLevy
      )}

      </td>

      </tr>

      </tbody>

      </table>

      <hr/>

      <div
      style={{
      display:"flex",
      justifyContent:"space-between",
      fontSize:20,
      fontWeight:700,
      }}
      >

      <span>

      Net Pay

      </span>

      <span
      style={{
      color:"green",
      }}
      >

      {formatCurrency(
      preview.totals?.netPay
      )}

      </span>

      </div>

      </Modal>

      )}

      {/* ==========================================================
          FINALIZE PAYROLL
      ========================================================== */}

      <Modal
          open={showFinalize}
          onClose={() => setShowFinalize(false)}
          title="Generate Payroll"
          footer={
              <>
                  <button
                      className="btn btn-outline"
                      onClick={() => setShowFinalize(false)}
                  >
                      Cancel
                  </button>

                  <button
                      className="btn btn-primary"
                      form="generate-payroll-form"
                      type="submit"
                      disabled={acting}
                  >
                      {acting
                          ? "Generating..."
                          : "Generate Payroll"}
                  </button>
              </>
          }
      >

      <form
          id="generate-payroll-form"
          onSubmit={handleFinalize}
      >

      <div className="form-group">

      <label className="form-label">

      Employee

      </label>

      <select

      className="form-control form-select"

      value={finalizeForm.employeeId}

      onChange={(e)=>

      setFinalizeForm(prev=>({

      ...prev,

      employeeId:e.target.value,

      }))

      }

      required

      >

      <option value="">

      Select Employee

      </option>

      {

      employees.map(employee=>(

      <option

      key={employee._id}

      value={employee._id}

      >

      {employee.user?.firstName}{" "}

      {employee.user?.lastName}

      </option>

      ))

      }

      </select>

      </div>

      <div className="form-group">

      <label className="form-label">

      Payroll Period

      </label>

      <select

      className="form-control form-select"

      value={finalizeForm.payrollPeriodId}

      onChange={(e)=>

      setFinalizeForm(prev=>({

      ...prev,

      payrollPeriodId:e.target.value,

      }))

      }

      required

      >

      <option value="">

      Select Payroll Period

      </option>

      {

      payrollPeriods.map(period=>(

      <option

      key={period._id}

      value={period._id}

      >

      {period.name}

      </option>

      ))

      }

      </select>

      </div>

      <div className="alert alert-info">

      <strong>Payroll Generation</strong>

      <ul style={{marginTop:10}}>

      <li>Attendance has already been locked.</li>

      <li>Allowances and deductions are calculated automatically.</li>

      <li>PAYE, NHIF, NSSF and Housing Levy are computed using the payroll engine.</li>

      <li>The payroll will be saved as a draft awaiting approval.</li>

      </ul>

      </div>

      </form>

      </Modal>
    </div>
  );
}