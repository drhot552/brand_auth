// Set new default font family and font color to mimic Bootstrap's default styling
Chart.defaults.global.defaultFontFamily = '-apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
Chart.defaults.global.defaultFontColor = '#292b2c';

// Pie Chart Example
// var brand_type = <%- JSON.stringify(brand_contract) %>
// var type = [];
// var count = [];
// for(var i =0; i < brand_type.length; i++){
//   type.push(brand_type[i].type);
//   count.push(brand_type[i].count);
// }
var ctx = document.getElementById("myPieChart");

var myPieChart = new Chart(ctx, {
  type: 'pie',
  data: {
    labels: ["가방", "지갑", "옷", "기타","기타2","기타3","기타4"],
    datasets: [{
      data: [1,2,3,4,5,6,7],
      backgroundColor: ['#007bff', '#dc3545', '#ffc107', '#28a745','#a9f5f2','#f5a9bc','#610b4b'],
    }],
  },
});
