Ext.define('Optima5.Modules.Spec.RsiRecouveo.ReportDashboardPage',{
	extend: 'Ext.panel.Panel',
	alias: 'widget.op5specrsiveoreportdashboardpage',
	
	_dashboardPanel: null,
	_actionTransferStepIdx: null,
	
	_viewInstalled: false,
	
	initComponent: function() {
		if( !(this._dashboardPanel instanceof Optima5.Modules.Spec.RsiRecouveo.ReportDashboardPanel) ) {
			Optima5.Helper.logError('Spec:RsiRecouveo:ReportDashboardPage','No parent reference ?') ;
		}
		this.optimaModule = this._dashboardPanel.optimaModule ;
		this.callParent() ;
	},
	
	doLoad: function() {
		this.fireEvent('pagetitle',this,this.getTitleString()) ;
	},
	onLoad: function() {
		
	},
	getFilterData: function() {
		return this._dashboardPanel.getFilterValues() ;
	},
	
	getTitleString: function() {
		return "Page exemple" ;
	},
	
	showLoadmask: function() {
		if( this.rendered ) {
			this.doShowLoadmask() ;
		} else {
			this.on('afterrender',this.doShowLoadmask,this,{single:true}) ;
		}
	},
	doShowLoadmask: function() {
		if( this.loadMask ) {
			return ;
		}
		this.loadMask = Ext.create('Ext.LoadMask',{
			target: this,
			msg: RsiRecouveoLoadMsg.loadMsg
		}).show();
	},
	hideLoadmask: function() {
		this.un('afterrender',this.doShowLoadmask,this) ;
		if( this.loadMask ) {
			this.loadMask.destroy() ;
			this.loadMask = null ;
		}
	},
	
	dummyFn: function() {
		
	}
}) ;
