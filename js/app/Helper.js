Ext.define('Optima5.Helper',{
	singleton:true,
	
	registerApplication: function( op5CoreApp ) {
		console.dir( op5CoreApp ) ;
	},
			  
	dummyMethod: function(){
		console.log('Dummy was called !') ;
	}
});
