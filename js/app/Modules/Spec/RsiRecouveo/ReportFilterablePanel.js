Ext.define('Optima5.Modules.Spec.RsiRecouveo.ReportFilterablePanel',{
	extend: 'Ext.panel.Panel',
	
	initComponent: function() {
		Ext.apply(this,{
			tbar:[{
				hidden: this._reportMode,
				icon: 'images/modules/rsiveo-back-16.gif',
				text: '<u>Menu</u>',
				itemId: 'menu',
				handler: function(){
					this.doQuit() ;
				},
				scope: this
			},'-',Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamButton',{
				itemId: 'tbSoc',
				cfgParam_id: 'SOC',
				icon: 'images/modules/rsiveo-blocs-16.gif',
				selectMode: 'MULTI',
				optimaModule: this.optimaModule,
				listeners: {
					change: {
						fn: function() {
							this.onSocSet() ;
						},
						scope: this
					},
					ready: {
						fn: function() {
							
						},
						scope: this
					}
				}
			}),{
				itemId: 'tbAtr',
				border: false,
				xtype: 'toolbar',
				items: []
			},'-',Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamButton',{
				itemId: 'tbUser',
				cfgParam_id: 'USER',
				icon: 'images/modules/rsiveo-users-16.png',
				selectMode: 'SINGLE',
				optimaModule: this.optimaModule,
				listeners: {
					change: {
						fn: function() {
							this.onUserSet() ;
						},
						scope: this
					},
					ready: {
						fn: function() {
							
						},
						scope: this
					}
				}
			}),'->',{
				itemId: 'btnFilterDate',
				xtype: 'button',
				textBase: 'Dates période',
				hidden: this._hideDates,
				menu: [{
					xtype: 'form',
					bodyPadding: 6,
					bodyCls: 'ux-noframe-bg',
					width: 200,
					layout: 'anchor',
					fieldDefaults: {
						anchor: '100%',
						labelWidth: 75
					},
					items: [{
						xtype: 'hiddenfield',
						name: 'date_period'
					},{
						xtype: 'datefield',
						format: 'Y-m-d',
						name: 'date_start',
						fieldLabel: 'Date début',
						listeners: {
							change: function(f) {
								//this.onDateSet() ;
								var form = f.up('form'),
									filterDateValues = form.getForm().getFieldValues() ;
								if( !filterDateValues.date_start || !filterDateValues.date_end ) {
									return ;
								}
								if( filterDateValues.date_start > filterDateValues.date_end ) {
									var date_end = Ext.Date.add(filterDateValues.start, Ext.Date.MONTH, 1) ;
									form.getForm().findField('date_end').setValue(date_end) ;
								}
							},
							scope: this
						}
					},{
						xtype: 'datefield',
						format: 'Y-m-d',
						name: 'date_end',
						fieldLabel: 'Date fin',
						listeners: {
							change: function(f) {
								//this.onDateSet() ;
								var form = f.up('form'),
									filterDateValues = form.getForm().getFieldValues() ;
								if( !filterDateValues.date_start || !filterDateValues.date_end ) {
									return ;
								}
								if( filterDateValues.date_start > filterDateValues.date_end ) {
									var date_start = Ext.Date.subtract(filterDateValues.date_end, Ext.Date.MONTH, 1) ;
									form.getForm().findField('date_start').setValue(date_start) ;
								}
							},
							scope: this
						}
					}],
					buttons: [{
						text: 'Appliquer',
						handler: function(btn) {
							var form = btn.up('form') ;
							form.up('menu').hide() ;
							this.onDateSet() ;
						},
						scope: this
					}]
				}]
			},{
				xtype: 'button',
				itemId: 'btnFilterPeriodes',
				hidden: this._hideDates,
				text: 'Périodes',
				menu: {
					defaults: {
						handler: function(btn) {
							var period = btn._period ;
							this.onDateSet( btn._period ) ;
						},
						scope: this
					},
					items: [{
						_period: 'day',
						icon: 'images/modules/dbsembramach-calendar-day-16.png',
						text: 'Dernier jour'
					},{
						_period: 'week',
						icon: 'images/modules/dbsembramach-calendar-week-16.png',
						text: 'Dernière semaine'
					},{
						_period: 'month',
						icon: 'images/modules/dbsembramach-calendar-month-16.png',
						text: 'Dernier mois'
					}]
				}
			},'-',{
				hidden: true,
				itemId: 'btnDemoDownload',
				xtype: 'button',
				icon: 'images/op5img/ico_save_16.gif',
				text: 'Télécharger PDF',
				handler: function() {
					this.demoOpenDownload() ;
				},
				scope: this
			}]
		}) ;
		this.callParent() ;
		
		this.buildToolbar() ;
	},
	buildToolbar: function() {
		var tbAtr = this.down('#tbAtr') ;
		tbAtr.removeAll() ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds(), function(atrId) {
			var atrRecord = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAtrHeader(atrId) ;
			if( !atrRecord.is_filter ) {
				return ;
			}
			var btn = Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamButton',{
				cfgParam_id: 'ATR:'+atrRecord.atr_id,
				cfgParam_atrType: atrRecord.atr_type,
				icon: 'images/modules/rsiveo-blocs-16.gif',
				selectMode: 'MULTI',
				optimaModule: this.optimaModule,
				listeners: {
					change: {
						fn: function() {
							this.onAtrSet() ;
						},
						scope: this
					},
					ready: {
						fn: function() {
							
						},
						scope: this
					}
				}
			}) ;
			btn.fillValues( atrRecord.filter_values ) ;
			tbAtr.add(btn);
		},this) ;
		this.configureToolbar() ;
	},
	configureToolbar: function() {
		var tbSoc = this.down('#tbSoc'),
			tbSocsSelected = tbSoc.getLeafNodesKey() ;
		var cfgParamIds = [] ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds(tbSocsSelected), function(atrId) {
			var atrRecord = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAtrHeader(atrId) ;
			cfgParamIds.push( 'ATR:'+atrRecord.atr_id ) ;
		}) ;
		
		var tbAtr = this.down('#tbAtr') ;
		tbAtr.items.each( function(atrBtn) {
			var doHide = false ;
			
			var atrBtnId = atrBtn.cfgParam_id ;
			if( !Ext.Array.contains(cfgParamIds,atrBtnId) ) {
				doHide = true ;
			}
			
			if( atrBtn.cfgParam_atrType=='record' && this.viewMode=='account' ) {
				doHide = true ;
			}
			
			atrBtn.setVisible( !doHide ) ;
		},this) ;
	},
	
	onSocSet: function() {
		this.configureToolbar() ;
		
		var tbAtr = this.down('#tbAtr') ;
		tbAtr.items.each( function(atrBtn) {
			// Reset atr specific values
			this.setValue(null,true) ;
		}) ;
		this.doTbarChanged() ;
	},
	onAtrSet: function() {
		this.doTbarChanged() ;
	},
	onUserSet: function() {
		this.doTbarChanged() ;
	},
	onDateSet: function(doPreset) {
		if( doPreset ) {
			var formValues = {} ;
			switch( doPreset ) {
				case 'month' :
					formValues = {
						date_start: Ext.Date.subtract(new Date(), Ext.Date.MONTH, 1),
						date_end: new Date()
					} ;
					break ;
					
				case 'week' :
					formValues = {
						date_start: Ext.Date.subtract(new Date(), Ext.Date.DAY, 7),
						date_end: new Date()
					} ;
					break ;
					
				case 'day' :
					formValues = {
						date_start: Ext.Date.subtract(new Date(), Ext.Date.DAY, 1),
						date_end: new Date()
					} ;
					break ;
			}
			if( formValues ) {
				formValues['date_period'] = doPreset ;
				var filterDateForm = this.down('#btnFilterDate').menu.down('form') ;
				filterDateForm.getForm().setValues( formValues ) ;
			}
		}
		var filterDateForm = this.down('#btnFilterDate').menu.down('form'),
			filterDateValues = filterDateForm.getForm().getFieldValues() ;
		var filterDateBtn = this.down('#btnFilterDate') ;
		var txt ;
		if( !filterDateValues.date_start && !filterDateValues.date_end ) {
			txt = filterDateBtn.textBase ;
		} else {
			txt = [] ;
			if( filterDateValues.date_start ) {
				txt.push('Du : '+Ext.Date.format(filterDateValues.date_start,'d/m/Y')) ;
			}
			if( filterDateValues.date_end ) {
				txt.push('Au : '+Ext.Date.format(filterDateValues.date_end,'d/m/Y')) ;
			}
			txt = txt.join(' / ') ;
		}
		filterDateBtn.setText(txt) ;
		
		this.doTbarChanged() ;
	},
	
	getFilterValues: function() {
		var objAtrFilter = {}, arrSocFilter=null, arrUserFilter=null ;
		Ext.Array.each( this.query('toolbar > [cfgParam_id]'), function(cfgParamBtn) {
			var cfgParam_id = cfgParamBtn.cfgParam_id ;
			if( Ext.isEmpty(cfgParamBtn.getValue()) ) {
				return ;
			}
			if( cfgParam_id.indexOf('ATR:')===0 ) {
				var atrId = cfgParam_id.substr(4) ;
				objAtrFilter[atrId] = cfgParamBtn.getValue()
			}
			if( cfgParam_id=='SOC' ) {
				arrSocFilter = cfgParamBtn.getLeafNodesKey() ;
			}
			if( cfgParam_id=='USER' ) {
				arrUserFilter = cfgParamBtn.getLeafNodesKey() ;
			}
		}) ;
		var filterDateForm = this.down('#btnFilterDate').menu.down('form'),
			filterDateValues = filterDateForm.getForm().getValues() ;
		
		return {
			filter_atr: objAtrFilter,
			filter_soc: arrSocFilter,
			filter_user: arrUserFilter,
			filter_date: filterDateValues
		} ;
	},
	doTbarChanged: function() {
		this.onTbarChanged(this.getFilterValues()) ;
	},
	onTbarChanged: function(filterValues) {
		// to be overriden
	},
	
	setFilterValues: function(filterValues) {
		Ext.Array.each( this.query('toolbar > [cfgParam_id]'), function(cfgParamBtn) {
			var cfgParam_id = cfgParamBtn.cfgParam_id ;
			cfgParamBtn.setValue(null) ;
			if( cfgParam_id.indexOf('ATR:')===0 ) {
				var atrId = cfgParam_id.substr(4) ;
				if( filterValues['filter_atr'] && filterValues['filter_atr'][atrId] ) {
					cfgParamBtn.setValue( filterValues['filter_atr'][atrId] ) ;
				}
			}
			if( cfgParam_id=='SOC' ) {
				if( filterValues['filter_soc'] ) {
					console.dir(filterValues['filter_soc']) ;
					cfgParamBtn.setValue( filterValues['filter_soc'] ) ;
				}
			}
			if( cfgParam_id=='USER' ) {
				if( filterValues['filter_user'] ) {
					cfgParamBtn.setValue( filterValues['filter_user'] ) ;
				}
			}
		}) ;
		
	}
	
}) ;
