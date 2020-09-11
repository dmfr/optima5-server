Ext.define('Optima5.Modules.Spec.RsiRecouveo.FilesTopAccountPanel',{
	extend:'Ext.form.Panel',
	
	requires: [],
	
	initComponent: function() {
		var chrtLeftText = Ext.create('Ext.draw.sprite.Text', {
			type: 'text',
			text: '',
			fontSize: 12,
			fontFamily: 'Play, sans-serif',
			width: 100,
			height: 30,
			x: 30, // the sprite x position
			y: 34  // the sprite y position
		});
		Ext.apply(this,{
			bodyPadding: 10,
			bodyCls: 'ux-noframe-bg',
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			fieldDefaults: {
				labelWidth: 100,
				anchor: '100%'
			},
			items: [{
				xtype: 'fieldset',
				layout: 'anchor',
				title: 'Top X / Nombre de dossiers',
				items: [{
					xtype: 'radiogroup',
					fieldLabel: 'Statut',
					columns: 1,
					vertical: true,
					listeners: {
						change: function(rg,newValue,oldValue) {
							this.onChangeStatus() ;
						},
						scope: this
					},
					items: [
						{ boxLabel: 'Tous statuts', name: 'status', inputValue: '', checked: true },
						{ boxLabel: 'Echu uniquement', name: 'status', inputValue: '!S0_PRE'},
						{ boxLabel: 'Non échu uniquement', name: 'status', inputValue: 'S0_PRE'}
					],
				},{
					xtype: 'numberfield',
					anchor: '',
					width: 200,
					name: 'count_value',
					itemId: 'displayNb',
					fieldLabel: 'Nb dossiers',
					listeners: {
						change: function( field, value ) {
							this.onChangeValue(value) ;
							this.doApplyParams() ;
						},
						scope: this
					}
				},{
					anchor: '100%',
					xtype: 'slider',
					itemId: 'sliderNb',
					name: 'count_slider',
					increment: 1,
					value: 0,
					minValue: 0,
					maxValue: this.loadData.length,
					listeners: {
						change: function(slider,value) {
							this.onChangeSlider(value) ;
						},
						changecomplete: function(slider,value) {
							this.doApplyParams() ;
						},
						scope: this
					}
				}]
			},{
				itemId: 'fsEc',
				hidden: true,
				xtype: 'fieldset',
				title: 'Part de l\'encours',
				flex: 1,
				items: [{
					xtype: 'displayfield',
					itemId: 'displayEc',
					fieldLabel: 'Encours'
				},{
					height: 60,
					//hidden: true,
					xtype: 'cartesian',
					animation: false,
					itemId: 'chrt',
					colors: ['#999999','#eeeeee'],
					border: false,
					width: '100%',
					/*legend: {
						docked: 'bottom',
						toggleable: false
					},*/
					store: {
						fields: [
							{name:'cat', type:'string'},
							{name:'amount_in', type:'number'},
							{name:'amount_out', type:'number'}
						],
						data: []
					},
					insetPadding: { top: 10, left: 10, right: 30, bottom: 10 },
					flipXY: true,
					_textSprites: [chrtLeftText],
					sprites: [chrtLeftText],
					axes: [/*{
						type: 'numeric',
						position: 'bottom',
						adjustByMajorUnit: true,
						fields: agendaChrtYFields,
						grid: true,
						renderer: function (v) { return v + ''; },
						minimum: 0
					}, */{
						type: 'category',
						position: 'left',
						fields: 'cat',
						grid: true
					}],
					series: [{
						type: 'bar',
						axis: 'bottom',
						//title: agendaChrtTitles,
						xField: 'cat',
						yField: ['amount_in','amount_out'],
						stacked: true,
						style: {
							opacity: 0.80
						}
					}]
					
				}]
			}]
		}) ;
		this.callParent() ;
		this.onChangeStatus() ;
		this.onChangeSlider(0) ;
	},
	
	transformDataAccount: function(loadData, statusValue) {
		var newLoadData = {} ;
		
		var filterNeg = false ;
		if( !Ext.isEmpty(statusValue) && statusValue[0] == '!' ) {
			statusValue = statusValue.substr(1) ;
			filterNeg = true ;
		}
		Ext.Array.each( loadData, function(fileRow) {
			var doSkip = false ;
			if( !Ext.isEmpty(statusValue) ) {
				if( filterNeg && (statusValue==fileRow.status) ) {
					doSkip = true ;
				}
				if( !filterNeg && (statusValue!=fileRow.status) ) {
					doSkip = true ;
				}
			}
			if( doSkip ) {
				return ;
			}
			var accId = fileRow['acc_id'] ;
			if( !newLoadData.hasOwnProperty(accId) ) {
				newLoadData[accId] = {
					acc_id: fileRow['acc_id'],
					acc_txt: fileRow['acc_txt'],
					inv_nb_total: 0,
					inv_amount_due: 0,
					inv_amount_total: 0,
					file_rows: []
				} ;
			}
			newLoadData[accId]['inv_amount_due'] += fileRow['inv_amount_due'] ;
			newLoadData[accId]['inv_amount_total'] += fileRow['inv_amount_total'] ;
			newLoadData[accId]['inv_nb_total'] += fileRow['inv_nb_total'] ;
			newLoadData[accId]['file_rows'].push( fileRow ) ;
		}) ;
		return Ext.Object.getValues(newLoadData) ;
	},
	
	onChangeStatus: function() {
		var statusValue = this.getForm().getValues()['status'] ;
		this.loadDataAccount = this.transformDataAccount(this.loadData, statusValue) ;
		
		var tmpArr = this.loadDataAccount ;
		var mslider = this.down('slider') ;
		mslider.setValue(0) ;
		mslider.setMaxValue(tmpArr.length) ;
		this.doApplyParams() ;
	},
	onChangeSlider: function(cnt) {
		if( cnt>0 ) {
			this.down('#displayNb').setValue(cnt) ;
		} else {
			this.down('#displayNb').setValue(0) ;
		}
	},
	onChangeValue: function(cnt) {
		this.down('#sliderNb').setValue(cnt) ;
	},
	doApplyParams: function() {
		var values = this.getForm().getFieldValues() ;
		
		var status = values.status,
			cnt = values.count_value ;
			
		var tmpArrAccount = this.loadDataAccount ;

		tmpArrAccount.sort( function(o1,o2) {
			return o2['inv_amount_due'] - o1['inv_amount_due'] ;
		}) ;
		
		var amountTot = 0 ;
		Ext.Array.each( tmpArrAccount, function(r) {
			amountTot += r['inv_amount_due'] ;
		}) ;
		
		if( cnt > 0 ) {
			this.down('#fsEc').setVisible(true) ;
			tmpArrAccount = tmpArrAccount.slice(0,cnt) ;
			
			var amountEc = 0 ;
			Ext.Array.each( tmpArrAccount, function(r) {
				amountEc += r['inv_amount_due'] ;
			}) ;
			this.down('#displayEc').setValue( Ext.util.Format.number(amountEc,'0,000.00')+'&#160;'+'€' ) ;
			
			this.down('#chrt').getStore().loadData([{
				cat: ' ',
				amount_in: amountEc,
				amount_out: amountTot-amountEc
			}]);
			this.down('#chrt')._textSprites[0].setAttributes({
				text: ''+Math.round(amountEc*100/amountTot)+' %'
			},true) ;
			
			this.fireSaved(tmpArrAccount) ;
		} else {
			this.down('#fsEc').setVisible(false) ;
			this.fireSaved(tmpArrAccount) ;
		}
		
	},
	
	fireSaved: function(tmpArrAccount) {
		var tmpArr = [] ;
		Ext.Array.each( tmpArrAccount, function(accountRow) {
			tmpArr = tmpArr.concat(accountRow.file_rows) ;
		}) ;
		this.fireEvent('saved',this,tmpArr) ;
	}
	
	
	
	
	
}) ;
